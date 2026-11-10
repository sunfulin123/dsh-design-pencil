//! Shared converter helpers — ports `converters/common.ts`. Position
//! / rotation / flip extraction from Figma transforms, corner-radius
//! mapping, base-prop assembly, the conversion context, and the
//! SYMBOL-subtree rescaler.

use crate::figma_types::{BlobOrString, FigMatrix, FigVec2};
use crate::instance::InstanceExpansionCache;
use crate::kiwi::FigValue;
use crate::mappers::{map_blend_mode, map_height_sizing, map_width_sizing};
use crate::mask::figma_mask_type;
use crate::tree::TreeNode;
use crate::vector_decoder::{INSTANCE_GEOMETRY_SCALE_X, INSTANCE_GEOMETRY_SCALE_Y};
use jian_ops_schema::node::base::{NumberOrExpression, PenNodeBase};
use jian_ops_schema::node::container::CornerRadius;
use jian_ops_schema::sizing::SizingBehavior;
use std::collections::HashMap;
use std::sync::RwLock;

/// Stroke vs fill rendering for a host-resolved icon.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum IconStyle {
    Stroke,
    Fill,
}

/// Host-resolved icon match (ports TS `IconLookupResult`). `d` is the
/// canonical 24×24 lucide path; `icon_id` is the canonical lucide name
/// (kebab-case) so the renderer can re-resolve; `style` defaults to
/// stroke when unspecified.
#[derive(Debug, Clone)]
pub struct IconLookupResult {
    pub d: String,
    pub icon_id: Option<String>,
    pub style: Option<IconStyle>,
}

type IconLookupFn = dyn Fn(&str) -> Option<IconLookupResult> + Send + Sync;

static ICON_LOOKUP: RwLock<Option<Box<IconLookupFn>>> = RwLock::new(None);

/// Install (or replace) a host-provided icon-name resolver. The
/// converter consults it on every VECTOR node — if a node's name maps
/// to a registered icon, the converter emits a `Path` carrying the
/// lucide `d` + `icon_id` instead of decoding the raw vector geometry.
/// Matches TS `setIconLookup` in `converters/common.ts`.
pub fn set_icon_lookup<F>(f: F)
where
    F: Fn(&str) -> Option<IconLookupResult> + Send + Sync + 'static,
{
    if let Ok(mut slot) = ICON_LOOKUP.write() {
        *slot = Some(Box::new(f));
    }
}

/// Drop any previously-installed icon resolver.
pub fn clear_icon_lookup() {
    if let Ok(mut slot) = ICON_LOOKUP.write() {
        *slot = None;
    }
}

/// Resolve `name` through the installed lookup; `None` when no
/// resolver is set or when the resolver itself returns `None`.
pub fn lookup_icon_by_name(name: &str) -> Option<IconLookupResult> {
    let slot = ICON_LOOKUP.read().ok()?;
    let f = slot.as_ref()?;
    f(name)
}

/// Whether OpenPencil layout semantics or verbatim Figma geometry is
/// produced.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FigLayoutMode {
    /// Keep Figma's fixed pixel sizes.
    Preserve,
    /// Resolve auto-layout into OpenPencil sizing keywords.
    OpenPencil,
}

/// Node types Figma emits that have no OpenPencil equivalent.
pub const SKIPPED_TYPES: &[&str] = &[
    "SLICE",
    "CONNECTOR",
    "SHAPE_WITH_TEXT",
    "STICKY",
    "STAMP",
    "HIGHLIGHT",
    "WASHI_TAPE",
    "CODE_BLOCK",
    "MEDIA",
    "WIDGET",
    "SECTION_OVERLAY",
    "NONE",
];

/// State threaded through the whole conversion pass.
pub struct ConversionContext<'tree> {
    /// Figma SYMBOL guid → minted `fig_N` ref id.
    pub component_map: HashMap<String, String>,
    /// Figma SYMBOL guid → its source subtree (for instance inlining).
    /// Borrowing the prepared tree avoids a second, overlapping copy of all
    /// component definitions while conversion is active.
    pub symbol_tree: HashMap<String, &'tree TreeNode>,
    /// Non-fatal conversion notes.
    pub warnings: Vec<String>,
    /// Sequential `fig_N` id allocator.
    pub id_counter: u32,
    /// Geometry / image blob pool.
    pub blobs: Vec<BlobOrString>,
    pub layout_mode: FigLayoutMode,
    /// Cross-instance virtual-GUID assignment pins ("sym|pk" → node
    /// guid) shared by every instance of the same SYMBOL.
    pub instance_assignments: HashMap<String, String>,
    /// Exact, bounded memoization of resolved instance child trees.
    pub instance_expansions: InstanceExpansionCache,
    /// Component/instance linkage, when the caller keeps the whole document
    /// (see [`crate::linkage`]). `None` always emits exact expansions.
    pub linkage: Option<crate::linkage::Linkage>,
    /// Nesting depth inside instance expansions / component definitions;
    /// only depth-0 (page-level) instances are linked.
    pub expansion_depth: u32,
    /// Convert hidden layers as `visible: false` instead of dropping them
    /// (linkage components, so instances can re-show them by override).
    pub keep_hidden: bool,
    /// Color variables for resolving bound paints in expanded instances.
    pub variables: std::rc::Rc<crate::paint_vars::VariableIndex>,
    /// Explicit variable modes of the ancestors being converted.
    pub mode_scope: crate::paint_vars::ModeScope,
}

impl ConversionContext<'_> {
    /// Mint the next sequential `fig_N` id.
    pub fn generate_id(&mut self) -> String {
        let id = format!("fig_{}", self.id_counter);
        self.id_counter += 1;
        id
    }
}

// ── Rounding (JS `Math.round` = floor(x + 0.5)) ───────────────────

pub fn js_round(x: f64) -> f64 {
    (x + 0.5).floor()
}

pub fn round2(v: f64) -> f64 {
    js_round(v * 100.0) / 100.0
}

pub fn round3(v: f64) -> f64 {
    js_round(v * 1000.0) / 1000.0
}

/// Normalise an angle into `[0, 360)`, 2-decimal rounded.
pub fn normalize_angle(deg: f64) -> f64 {
    let mut a = deg % 360.0;
    if a < 0.0 {
        a += 360.0;
    }
    round2(a)
}

// ── Transform → geometry ──────────────────────────────────────────

/// Recover a node's pre-transform top-left in parent space. For
/// rotated / flipped nodes the (invariant) centre is used; for
/// axis-aligned nodes `(m02, m12)` is the top-left directly.
pub fn extract_position(figma: &FigValue) -> (f64, f64) {
    let Some(m) = figma.get("transform").and_then(FigMatrix::from_value) else {
        return (0.0, 0.0);
    };
    let has_rotation = m.m01.abs() > 0.001 || m.m10.abs() > 0.001;
    let has_flip = m.m00 < -0.001 || m.m11 < -0.001;
    if has_rotation || has_flip {
        if let Some(size) = figma.get("size") {
            let w = size.get_f64("x").unwrap_or(0.0);
            let h = size.get_f64("y").unwrap_or(0.0);
            let cx = m.m00 * w / 2.0 + m.m01 * h / 2.0 + m.m02;
            let cy = m.m10 * w / 2.0 + m.m11 * h / 2.0 + m.m12;
            return (round2(cx - w / 2.0), round2(cy - h / 2.0));
        }
    }
    (round2(m.m02), round2(m.m12))
}

/// Rotation in degrees to two decimal places (`abs(m00)` ignores horizontal flip).
/// `None` when zero.
pub fn extract_rotation(figma: &FigValue) -> Option<f64> {
    let m = figma.get("transform").and_then(FigMatrix::from_value)?;
    let angle = m.m10.atan2(m.m00.abs()) * (180.0 / std::f64::consts::PI);
    let rounded = round2(angle);
    if rounded != 0.0 {
        Some(rounded)
    } else {
        None
    }
}

/// Single-axis flip recovered from the transform determinant. At most
/// one of `(flipX, flipY)` is ever set.
pub fn extract_flip(figma: &FigValue) -> (Option<bool>, Option<bool>) {
    let Some(m) = figma.get("transform").and_then(FigMatrix::from_value) else {
        return (None, None);
    };
    let det = m.m00 * m.m11 - m.m01 * m.m10;
    if det < -0.001 {
        if m.m00 < 0.0 {
            (Some(true), None)
        } else {
            (None, Some(true))
        }
    } else {
        (None, None)
    }
}

/// Corner radius — uniform number, per-corner `[tl, tr, br, bl]`, or
/// nothing.
pub fn map_corner_radius(figma: &FigValue) -> Option<CornerRadius> {
    if figma.get_bool("rectangleCornerRadiiIndependent") == Some(true) {
        let tl = figma.get_f64("rectangleTopLeftCornerRadius").unwrap_or(0.0);
        let tr = figma
            .get_f64("rectangleTopRightCornerRadius")
            .unwrap_or(0.0);
        let br = figma
            .get_f64("rectangleBottomRightCornerRadius")
            .unwrap_or(0.0);
        let bl = figma
            .get_f64("rectangleBottomLeftCornerRadius")
            .unwrap_or(0.0);
        if tl == tr && tr == br && br == bl {
            return if tl > 0.0 {
                Some(CornerRadius::Uniform(tl))
            } else {
                None
            };
        }
        return Some(CornerRadius::PerCorner([tl, tr, br, bl]));
    }
    match figma.get_f64("cornerRadius") {
        Some(cr) if cr > 0.0 => Some(CornerRadius::Uniform(cr)),
        _ => None,
    }
}

/// Figma continuous-corner smoothing, clamped to its documented
/// normalized range. Missing and non-positive values keep the native
/// rounded-rectangle representation.
pub fn map_corner_smoothing(figma: &FigValue) -> f64 {
    figma
        .get_f64("cornerSmoothing")
        .unwrap_or(0.0)
        .clamp(0.0, 1.0)
}

/// Assemble the shared base props spread into every PenNode.
/// Synthetic field carrying a node's REST-form Figma id when it differs from
/// its record `guid` (instance sub-layers, REST payload ids).
pub(crate) const SOURCE_ID_KEY: &str = "dshSourceId";

pub fn common_props(figma: &FigValue, id: String) -> PenNodeBase {
    let (x, y) = extract_position(figma);
    let (flip_x, flip_y) = extract_flip(figma);
    let mut base = PenNodeBase {
        id,
        name: figma
            .get_str("name")
            .filter(|s| !s.is_empty())
            .map(|s| s.to_string()),
        role: None,
        explain: None,
        x: Some(x),
        y: Some(y),
        rotation: extract_rotation(figma),
        opacity: figma
            .get_f64("opacity")
            .filter(|o| *o < 1.0)
            .map(NumberOrExpression::Number),
        enabled: None,
        visible: None,
        preview_as_screen: None,
        locked: if figma.get_bool("locked") == Some(true) {
            Some(true)
        } else {
            None
        },
        pin: None,
        flip_x,
        flip_y,
        lock_aspect_ratio: figma.get_bool("constrainProportions"),
        component_design: None,
        component_values: None,
        mask_type: figma_mask_type(figma),
        blend_mode: map_blend_mode(figma.get_str("blendMode")),
        theme: None,
        variable_bindings: None,
        transition: None,
        animations: None,
        // Figma import never authors responsive size constraints.
        constraints: None,
        figma_node_id: figma
            .get_str(SOURCE_ID_KEY)
            .map(str::to_string)
            .or_else(|| figma.get("guid").and_then(crate::tree::guid_to_string)),
        reactions: None,
        scroll_behavior: None,
        overflow_direction: None,
        overlay: None,
        section: None,
        flow_starting_point: None,
    };
    crate::fig_prototype::apply_node_prototype(figma, &mut base);
    base
}

/// Width as a `SizingBehavior` — fixed pixels in preserve mode, the
/// auto-layout resolution otherwise.
pub fn resolve_width(
    figma: &FigValue,
    parent_stack_mode: Option<&str>,
    ctx: &ConversionContext<'_>,
) -> SizingBehavior {
    match ctx.layout_mode {
        FigLayoutMode::Preserve => SizingBehavior::Number(
            figma
                .get("size")
                .and_then(|s| s.get_f64("x"))
                .unwrap_or(100.0),
        ),
        FigLayoutMode::OpenPencil => map_width_sizing(figma, parent_stack_mode),
    }
}

/// Height as a `SizingBehavior` — see [`resolve_width`].
pub fn resolve_height(
    figma: &FigValue,
    parent_stack_mode: Option<&str>,
    ctx: &ConversionContext<'_>,
) -> SizingBehavior {
    match ctx.layout_mode {
        FigLayoutMode::Preserve => SizingBehavior::Number(
            figma
                .get("size")
                .and_then(|s| s.get_f64("y"))
                .unwrap_or(100.0),
        ),
        FigLayoutMode::OpenPencil => map_height_sizing(figma, parent_stack_mode),
    }
}

/// Private markers consumed by the vector decoder after a component
/// instance scales node-local command geometry. Vector-network paths
/// derive their scale from `size / normalizedSize` and do not use it.
fn scale_number_field(figma: &mut FigValue, key: &str, scale: f64) {
    if let Some(value) = figma.get_f64(key) {
        figma.set(key, FigValue::Float(round2(value * scale) as f32));
    }
}

fn has_command_geometry(figma: &FigValue) -> bool {
    ["fillGeometry", "strokeGeometry"].iter().any(|key| {
        figma
            .get_array(key)
            .is_some_and(|geometry| !geometry.is_empty())
    })
}

/// A component parent's authored box, as its children see it when an
/// instance resizes it.
#[derive(Clone, Copy, Debug, PartialEq)]
pub(crate) struct ParentBox {
    pub w: f64,
    pub h: f64,
    /// Auto-layout direction (`true` = horizontal); `None` for a free frame.
    pub stack: Option<bool>,
}

/// How an instance's box differs from its component's, as seen by one
/// level of children. With `frame` each child follows Figma's resize rules:
/// constraints in a free frame, fixed size (unless it fills) in auto layout.
/// Without it the ratio applies uniformly. `uniform` marks a Scale-tool
/// instance (`uniformScaleFactor`), which scales its whole subtree.
#[derive(Clone, Copy, Debug, PartialEq)]
pub(crate) struct InstanceResize {
    pub sx: f64,
    pub sy: f64,
    pub frame: Option<ParentBox>,
    pub uniform: bool,
}

impl InstanceResize {
    pub(crate) const NONE: Self = Self {
        sx: 1.0,
        sy: 1.0,
        frame: None,
        uniform: false,
    };

    /// The resize `parent`'s children see when `parent` grows by `(sx, sy)`.
    pub(crate) fn of(parent: &FigValue, sx: f64, sy: f64, uniform: bool) -> Self {
        let frame = authored_frame(parent).filter(|_| !uniform);
        Self {
            sx,
            sy,
            frame,
            uniform,
        }
    }

    /// Same resize mode, re-based on a child that grew by `(sx, sy)`.
    pub(crate) fn nested(self, parent_frame: Option<ParentBox>, sx: f64, sy: f64) -> Self {
        let frame = parent_frame.filter(|_| !self.uniform);
        Self {
            sx,
            sy,
            frame,
            uniform: self.uniform,
        }
    }

    fn is_identity(&self) -> bool {
        (self.sx - 1.0).abs() < 0.001 && (self.sy - 1.0).abs() < 0.001
    }
}

/// The authored box a node presents to its children.
pub(crate) fn authored_frame(parent: &FigValue) -> Option<ParentBox> {
    let stack = match parent.get_str("stackMode") {
        Some("HORIZONTAL") => Some(true),
        Some("VERTICAL") => Some(false),
        _ => None,
    };
    let size = parent.get("size").and_then(FigVec2::from_value)?;
    Some(ParentBox {
        w: size.x,
        h: size.y,
        stack,
    })
}

/// Constraints a child resizes by. An auto-layout flow child keeps its
/// position and size (Figma's derived data moves it) unless it fills an
/// axis; absent constraints are Figma's default MIN (left / top).
fn resize_constraints<'a>(figma: &'a FigValue, parent: ParentBox) -> [Option<&'a str>; 2] {
    let flow = figma.get_str("stackPositioning") != Some("ABSOLUTE");
    match parent.stack.filter(|_| flow) {
        Some(horizontal) => {
            let grow = figma.get_f64("stackChildPrimaryGrow") == Some(1.0);
            let stretch = figma.get_str("stackChildAlignSelf") == Some("STRETCH");
            let fill = |on: bool| on.then_some("STRETCH");
            if horizontal {
                [fill(grow), fill(stretch)]
            } else {
                [fill(stretch), fill(grow)]
            }
        }
        None => [
            figma.get_str("horizontalConstraint"),
            figma.get_str("verticalConstraint"),
        ],
    }
}

/// New `(position, length)` on one axis when the parent grows by `ratio`.
fn constrained_axis(
    constraint: Option<&str>,
    pos: f64,
    len: f64,
    parent: f64,
    ratio: f64,
) -> (f64, f64) {
    let delta = parent * (ratio - 1.0);
    match constraint {
        Some("MAX" | "FIXED_MAX") => (pos + delta, len),
        Some("CENTER") => (pos + delta / 2.0, len),
        Some("STRETCH") => (pos, len + delta),
        Some("SCALE") => (pos * ratio, len * ratio),
        _ => (pos, len),
    }
}

fn resize_ratio(new: f64, old: f64) -> f64 {
    if old.abs() > 0.001 {
        new / old
    } else {
        1.0
    }
}

/// Resize one node's own fields in place, without touching children, and
/// return the ratio its own children inherit. Shared by the whole-subtree
/// rescaler and by the override resolver, which resizes node-by-node so a
/// branch can stop inheriting an outer instance's ratio the moment Figma
/// hands it resolved geometry.
pub(crate) fn scale_node_fields(figma: &mut FigValue, resize: InstanceResize) -> (f64, f64) {
    let (sx, sy) = (resize.sx, resize.sy);
    // An auto-growing text box is sized by its content at its authored
    // font size, not by the instance ratio — scaling it squeezes the
    // label (a 0.4-scaled button pinched a 24 px "搜索" box to 9.6 px
    // while its font stayed 12). Only a fixed box (`textAutoResize:
    // NONE`) follows the instance scale on the axis it fixes.
    let (scale_w, scale_h) = match figma.get_str("textAutoResize") {
        Some("WIDTH_AND_HEIGHT") => (false, false),
        Some("HEIGHT") => (true, false),
        _ => (true, true),
    };
    let transform = figma.get("transform").cloned();
    let pos = transform.as_ref().map_or((0.0, 0.0), |t| {
        (
            t.get_f64("m02").unwrap_or(0.0),
            t.get_f64("m12").unwrap_or(0.0),
        )
    });
    let size = figma.get("size").and_then(FigVec2::from_value);
    let (w, h) = size.map_or((0.0, 0.0), |s| (s.x, s.y));
    let ((x, mut nw), (y, mut nh)) = match resize.frame {
        Some(parent) => {
            let [cx, cy] = resize_constraints(figma, parent);
            (
                constrained_axis(cx, pos.0, w, parent.w, sx),
                constrained_axis(cy, pos.1, h, parent.h, sy),
            )
        }
        None => ((pos.0 * sx, w * sx.abs()), (pos.1 * sy, h * sy.abs())),
    };
    if !scale_w {
        nw = w;
    }
    if !scale_h {
        nh = h;
    }
    let (rx, ry) = match resize.frame {
        Some(_) => (resize_ratio(nw, w), resize_ratio(nh, h)),
        None => (sx, sy),
    };
    let metric_scale = rx.abs().min(ry.abs());
    if let Some(mut transform) = transform {
        transform.set("m02", FigValue::Float(x as f32));
        transform.set("m12", FigValue::Float(y as f32));
        figma.set("transform", transform);
    }
    if let Some(mut size) = figma.get("size").cloned() {
        size.set("x", FigValue::Float(nw as f32));
        size.set("y", FigValue::Float(nh as f32));
        figma.set("size", size);
    }
    // Stroke weights and corner radii follow the box: an icon symbol
    // authored at 120 px and instanced at 40 px reads as a 1/3-scale
    // drawing, strokes included. Text metrics deliberately do NOT
    // scale — resizing an instance in Figma reflows the text box and
    // leaves `fontSize` / line-height / letter-spacing as authored
    // (only the Scale tool rewrites those, and it bakes the new values
    // into the file, so they arrive here already correct).
    for key in [
        "strokeWeight",
        "borderTopWeight",
        "borderRightWeight",
        "borderBottomWeight",
        "borderLeftWeight",
        "cornerRadius",
        "rectangleTopLeftCornerRadius",
        "rectangleTopRightCornerRadius",
        "rectangleBottomRightCornerRadius",
        "rectangleBottomLeftCornerRadius",
    ] {
        scale_number_field(figma, key, metric_scale);
    }

    if has_command_geometry(figma) {
        let accumulated_x = figma.get_f64(INSTANCE_GEOMETRY_SCALE_X).unwrap_or(1.0) * rx;
        let accumulated_y = figma.get_f64(INSTANCE_GEOMETRY_SCALE_Y).unwrap_or(1.0) * ry;
        figma.set(
            INSTANCE_GEOMETRY_SCALE_X,
            FigValue::Float(accumulated_x as f32),
        );
        figma.set(
            INSTANCE_GEOMETRY_SCALE_Y,
            FigValue::Float(accumulated_y as f32),
        );
    }
    (rx, ry)
}

fn scale_tree_node(mut child: TreeNode, resize: InstanceResize) -> TreeNode {
    let frame = authored_frame(&child.figma);
    let (rx, ry) = scale_node_fields(&mut child.figma, resize);
    // Stop at nested instances. Their own resolution pass rescales
    // their subtree against their (already-scaled) box, and their
    // derived entries are recorded in nested-instance space — letting
    // an ancestor's ratio recurse past this point applies it twice
    // (a 0.4-scaled outer instance squeezed a nested button's label
    // box from 24 px to 9.6 px while its derived font size stayed 12).
    let is_nested_instance =
        child.figma.get_str("type") == Some("INSTANCE") || child.figma.get("symbolData").is_some();
    if !is_nested_instance {
        let inner = resize.nested(frame, rx, ry);
        child.children = scale_tree_children_owned(child.children, inner);
    }
    child
}

/// Recursively resize a SYMBOL subtree to fit a differently-sized
/// instance: children follow their Figma constraints (uniformly under an
/// auto-layout parent). Translation, size, vector geometry, stroke width
/// and corner radii follow; text metrics and the rotation matrix cells stay
/// as authored. Nested calls accumulate the command-geometry scale.
pub fn scale_tree_children(children: &[TreeNode], resize: InstanceResize) -> Vec<TreeNode> {
    scale_tree_children_owned(children.to_vec(), resize)
}

/// Owned variant used after derived data has already materialised a
/// fresh subtree, avoiding a second deep clone for instance-heavy files.
fn scale_tree_children_owned(children: Vec<TreeNode>, resize: InstanceResize) -> Vec<TreeNode> {
    if resize.is_identity() {
        return children;
    }
    children
        .into_iter()
        .map(|child| scale_tree_node(child, resize))
        .collect()
}

/// Detect which decoded blobs are images (by magic bytes), keyed by
/// blob index. Consumes the pool so image bytes move into the result
/// after geometry conversion instead of being cloned and retained in
/// two full buffers throughout the import.
pub fn collect_image_blobs(blobs: Vec<BlobOrString>) -> HashMap<u32, Vec<u8>> {
    let mut map = HashMap::new();
    for (i, blob) in blobs.into_iter().enumerate() {
        if let BlobOrString::Bytes(b) = blob {
            if b.len() > 8 {
                let is_image = (b[0] == 0x89 && b[1] == 0x50)
                    || (b[0] == 0xFF && b[1] == 0xD8)
                    || (b[0] == 0x47 && b[1] == 0x49)
                    || (b[0] == 0x52 && b[1] == 0x49);
                if is_image {
                    map.insert(i as u32, b);
                }
            }
        }
    }
    map
}

#[cfg(test)]
mod tests {
    use super::*;

    fn obj(pairs: Vec<(&str, FigValue)>) -> FigValue {
        FigValue::Object(pairs.into_iter().map(|(k, v)| (k.into(), v)).collect())
    }

    fn matrix(m00: f32, m01: f32, m02: f32, m10: f32, m11: f32, m12: f32) -> FigValue {
        obj(vec![
            ("m00", FigValue::Float(m00)),
            ("m01", FigValue::Float(m01)),
            ("m02", FigValue::Float(m02)),
            ("m10", FigValue::Float(m10)),
            ("m11", FigValue::Float(m11)),
            ("m12", FigValue::Float(m12)),
        ])
    }

    #[test]
    fn axis_aligned_position_is_translation() {
        let n = obj(vec![("transform", matrix(1.0, 0.0, 30.0, 0.0, 1.0, 40.0))]);
        assert_eq!(extract_position(&n), (30.0, 40.0));
    }

    #[test]
    fn rotation_extracted_in_degrees() {
        // 90° rotation: m00=0, m10=1.
        let n = obj(vec![("transform", matrix(0.0, -1.0, 0.0, 1.0, 0.0, 0.0))]);
        assert_eq!(extract_rotation(&n), Some(90.0));
    }

    #[test]
    fn rotation_preserves_sub_degree_precision() {
        let radians = 13.37_f64.to_radians();
        let n = obj(vec![(
            "transform",
            matrix(
                radians.cos() as f32,
                -radians.sin() as f32,
                0.0,
                radians.sin() as f32,
                radians.cos() as f32,
                0.0,
            ),
        )]);
        assert_eq!(extract_rotation(&n), Some(13.37));
    }

    #[test]
    fn horizontal_flip_detected() {
        // m00 negative, det negative → flipX.
        let n = obj(vec![("transform", matrix(-1.0, 0.0, 0.0, 0.0, 1.0, 0.0))]);
        assert_eq!(extract_flip(&n), (Some(true), None));
    }

    #[test]
    fn corner_radius_uniform_collapse() {
        let n = obj(vec![("cornerRadius", FigValue::Float(8.0))]);
        assert!(matches!(
            map_corner_radius(&n),
            Some(CornerRadius::Uniform(8.0))
        ));
    }

    #[test]
    fn corner_smoothing_is_clamped_to_normalized_range() {
        let high = obj(vec![("cornerSmoothing", FigValue::Float(1.5))]);
        let low = obj(vec![("cornerSmoothing", FigValue::Float(-0.5))]);
        assert_eq!(map_corner_smoothing(&high), 1.0);
        assert_eq!(map_corner_smoothing(&low), 0.0);
    }

    #[test]
    fn node_blend_mode_is_shared_by_every_figma_node_kind() {
        for kind in ["FRAME", "GROUP", "TEXT", "PATH", "INSTANCE"] {
            let node = obj(vec![
                ("type", FigValue::Str(kind.into())),
                ("blendMode", FigValue::Str("MULTIPLY".into())),
            ]);
            assert_eq!(
                common_props(&node, kind.to_ascii_lowercase()).blend_mode,
                Some(jian_ops_schema::style::BlendMode::Multiply),
                "{kind}"
            );
        }
    }

    #[test]
    fn js_round_is_floor_half_up() {
        assert_eq!(js_round(2.5), 3.0);
        assert_eq!(js_round(-0.5), 0.0);
        assert_eq!(js_round(-1.5), -1.0);
    }
}
