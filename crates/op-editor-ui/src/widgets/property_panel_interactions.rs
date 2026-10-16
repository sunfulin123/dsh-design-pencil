//! Interactions section — read-only screen marker + `events.onTap`
//! rows, plus the small Navigate/Back/Remove edit menu. New in this
//! change (the property panel previously showed no interaction
//! state at all, even though the generation pipeline
//! (`op-orchestrator::wire_screen_navigation`) has been wiring
//! `screen` + `events.onTap` into documents for a while).
//!
//! v1 scope, matching the plan this section ships against:
//! - `screen` is shown but not editable (a top-level screen frame's
//!   route path is read-only here; editing it is a v2 TODO).
//! - A single `onTap` action is editable via a small popover:
//!   "Navigate to <path>" (writes `replace`, one per authored
//!   `screen` on the current page) / "Back (pop)" / "Remove".
//! - Zero or one `onTap` action shows one clickable row; more than
//!   one shows every action read-only plus a single "Remove all"
//!   row (no per-action editing in v1 — see `InteractionSummary`).
//!
//! Data types (`InteractionSummary` / `TapActionSummary`) live here
//! rather than in `property_panel_snapshot.rs` (where every other
//! summary type lives) purely to avoid growing that already
//! 800-line-ceiling-busting file any further; the paint + geometry
//! helpers below follow the same section-file split as
//! `property_panel_effects.rs` / `property_panel_icon.rs`.

use crate::theme::Theme;
use crate::widgets::property_panel::PropertyPanelAction;
use crate::widgets::property_panel_inputs::{
    paint_section_divider, paint_section_label, INPUT_HEIGHT, INPUT_RADIUS, PAD_X, SECTION_GAP,
    SECTION_HEADER_HEIGHT,
};
use crate::widgets::PaintCx;
use crate::{Point2D, Rect, TextLayout};
use jian_ops_schema::events::Action;
use jian_ops_schema::node::PenNode;
use op_editor_core::pen_node_ext::PenNodeExt;

/// Which verb an authored Navigate action used. Manual edits from
/// this panel always write `Replace` (matches
/// `wire_screen_navigation`'s own tab-binding verb); `Push` is only
/// ever something a hand-authored or MCP-written document can carry,
/// shown read-only.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum NavigateVerb {
    Push,
    Replace,
}

impl NavigateVerb {
    #[allow(dead_code)]
    fn as_str(self) -> &'static str {
        match self {
            NavigateVerb::Push => "push",
            NavigateVerb::Replace => "replace",
        }
    }
}

/// One `events.onTap` action, summarized for display. `Other` covers
/// every action key besides navigation (`set`, `fetch`, …) — shown
/// as `Tap → <key>`, read-only (no v1 editor surface understands the
/// body of an arbitrary action).
#[derive(Debug, Clone, PartialEq)]
pub enum TapActionSummary {
    Navigate { verb: NavigateVerb, path: String },
    Pop,
    Other(String),
}

/// Interaction state for the selected node — always present (empty
/// when nothing is authored) so the section can paint its "+ Add
/// interaction" empty state. `screen` is `Some` only for a top-level
/// Frame carrying an authored `screen` route (see
/// `NodeSnapshot::from_node`'s caller, which gates this on the
/// selection being a page-root child).
#[derive(Debug, Clone, PartialEq, Default)]
pub struct InteractionSummary {
    pub screen: Option<String>,
    pub on_tap: Vec<TapActionSummary>,
}

/// Build the summary from a node's `events.onTap` + (when
/// `is_top_level`) its `screen` marker.
pub(crate) fn interactions_of(node: &PenNode, is_top_level: bool) -> InteractionSummary {
    InteractionSummary {
        screen: is_top_level
            .then(|| node.screen())
            .flatten()
            .map(str::to_string),
        on_tap: node
            .on_tap()
            .map(|actions| actions.iter().map(parse_tap_action).collect())
            .unwrap_or_default(),
    }
}

fn parse_tap_action(action: &Action) -> TapActionSummary {
    let Some((key, body)) = action.single() else {
        return TapActionSummary::Other(String::new());
    };
    match key {
        "push" => TapActionSummary::Navigate {
            verb: NavigateVerb::Push,
            path: unescape_path_literal(body),
        },
        "replace" => TapActionSummary::Navigate {
            verb: NavigateVerb::Replace,
            path: unescape_path_literal(body),
        },
        "pop" => TapActionSummary::Pop,
        other => TapActionSummary::Other(other.to_string()),
    }
}

/// `body` is the JSON string VALUE `"\"/path\""` (embedded quote
/// characters included) — the Tier-1 EXPRESSION source for a string
/// literal, per `wire_screen_navigation`'s navigate-patch contract
/// (`op-orchestrator/src/wire_screen_navigation.rs`). Strip the
/// embedded quote pair to recover the bare path for display; any
/// other shape (e.g. a hand-authored bare path with no expression
/// quoting) is shown as-is so the row never goes blank.
fn unescape_path_literal(body: &serde_json::Value) -> String {
    let Some(s) = body.as_str() else {
        return body.to_string();
    };
    s.strip_prefix('"')
        .and_then(|rest| rest.strip_suffix('"'))
        .unwrap_or(s)
        .to_string()
}

/// Build the `events.onTap` navigate patch JSON for this panel's
/// "Navigate to…" edit — always `replace` (v1 scope). `path` must
/// already be a `/`-rooted route path; the JSON string VALUE is the
/// literal `"<path>"` (quotes included) so it compiles as a Tier-1
/// string-literal expression. Constructed by the SAME double-encoding
/// `wire_screen_navigation::navigate_patch` uses, not hand-assembled,
/// so the two writers can never drift out of sync.
pub fn navigate_patch_json(path: &str) -> String {
    let body = serde_json::to_string(path).unwrap_or_default(); // -> "\"/path\""
    let escaped_body = serde_json::to_string(&body).unwrap_or_default(); // -> "\"\\\"/path\\\"\""
    format!(r#"{{"events":{{"onTap":[{{"replace":{escaped_body}}}]}}}}"#)
}

/// The `events.onTap` back (`pop`) patch JSON.
pub const POP_PATCH_JSON: &str = r#"{"events":{"onTap":[{"pop":null}]}}"#;

/// Scan the active page's top-level frames for authored `screen`
/// paths — the source list for the popover's "Navigate to <path>"
/// rows (`来源=扫当前页顶层 frame 的 screen 值`, not a fresh scan of
/// every possible screen-shaped frame the way
/// `wire_screen_navigation::collect_screen_candidates` does — this is
/// a read-only picker source, not a wiring pass). Order matches
/// document order.
pub fn document_screen_paths(state: &op_editor_core::EditorState) -> Vec<String> {
    state
        .active_children()
        .iter()
        .filter_map(|n| n.screen().map(str::to_string))
        .collect()
}

// ── Section paint + geometry ────────────────────────────────────────

use crate::widgets::property_panel_inputs::TEXTAREA_HEIGHT;

/// Total vertical space the Interactions & Semantics section consumes:
/// - 1 single-line Role input (`INPUT_HEIGHT`)
/// - optional Screen route input (`INPUT_HEIGHT`)
/// - 3 multi-line Textarea boxes (`TEXTAREA_HEIGHT` each): Interaction Action,
///   Accessibility (`无障碍`), and Design Note (`注释`).
pub fn interactions_section_height(interactions: &InteractionSummary) -> f32 {
    let single_rows = 1.0 + f32::from(u8::from(interactions.screen.is_some()));
    let textarea_rows = 3.0;
    SECTION_HEADER_HEIGHT
        + single_rows * (INPUT_HEIGHT + 6.0)
        + textarea_rows * (TEXTAREA_HEIGHT + 6.0)
        + 6.0
        + SECTION_GAP
}

/// Emit the editable input rects for the Semantics & Interactions section
/// (Role single-line input, optional Screen route, and 3 Textarea boxes:
/// Interaction Action, Accessibility Label, and Design Note).
pub fn push_interaction_input_rects(
    rects: &mut Vec<(op_editor_core::PropertyFocus, Rect)>,
    interactions: &InteractionSummary,
    x: f32,
    y: f32,
    width: f32,
) {
    use op_editor_core::PropertyFocus;
    let usable_w = width - PAD_X * 2.0;
    let mut row_y = y + SECTION_HEADER_HEIGHT;
    // Row 1: Semantic Role (single-line input)
    rects.push((
        PropertyFocus::NodeRole,
        Rect {
            origin: Point2D::new(x + PAD_X, row_y),
            size: Point2D::new(usable_w, INPUT_HEIGHT),
        },
    ));
    row_y += INPUT_HEIGHT + 6.0;
    if interactions.screen.is_some() {
        rects.push((
            PropertyFocus::ScreenPath,
            Rect {
                origin: Point2D::new(x + PAD_X, row_y),
                size: Point2D::new(usable_w, INPUT_HEIGHT),
            },
        ));
        row_y += INPUT_HEIGHT + 6.0;
    }
    // Textarea 1: Interaction Action description
    rects.push((
        PropertyFocus::NodeInteractionDesc,
        Rect {
            origin: Point2D::new(x + PAD_X, row_y),
            size: Point2D::new(usable_w, TEXTAREA_HEIGHT),
        },
    ));
    row_y += TEXTAREA_HEIGHT + 6.0;
    // Textarea 2: Accessibility Label / aria-label
    rects.push((
        PropertyFocus::NodeA11yLabel,
        Rect {
            origin: Point2D::new(x + PAD_X, row_y),
            size: Point2D::new(usable_w, TEXTAREA_HEIGHT),
        },
    ));
    row_y += TEXTAREA_HEIGHT + 6.0;
    // Textarea 3: Design Note / Explain
    rects.push((
        PropertyFocus::NodeExplain,
        Rect {
            origin: Point2D::new(x + PAD_X, row_y),
            size: Point2D::new(usable_w, TEXTAREA_HEIGHT),
        },
    ));
}

/// Legacy action-rect hook kept for layout-walker compatibility. The
/// interaction field is now a descriptive Textarea (`NodeInteractionDesc`)
/// rather than a dropdown menu.
pub fn push_interaction_action_rects(
    _out: &mut Vec<(PropertyPanelAction, Rect)>,
    _interactions: &InteractionSummary,
    _x: f32,
    _y: f32,
    _width: f32,
) {
}

#[allow(clippy::too_many_arguments)]
pub fn paint_interactions_section(
    cx: &mut PaintCx<'_>,
    theme: &Theme,
    snapshot: &crate::widgets::property_panel::NodeSnapshot,
    edit: &crate::widgets::property_panel_sections::EditContext<'_>,
    interactions: &InteractionSummary,
    locale: op_editor_core::Locale,
    x: f32,
    y: f32,
    width: f32,
) -> f32 {
    use crate::widgets::property_panel_inputs::{
        paint_input_with_prefix_and_placeholder, paint_input_with_prefix_focused_state,
        paint_textarea_with_label,
    };
    use op_editor_core::PropertyFocus;
    let is_zh = matches!(
        locale,
        op_editor_core::Locale::ZhCn | op_editor_core::Locale::ZhTw
    );
    let section_title = if is_zh {
        "语义与交互"
    } else {
        "Semantics & Interactions"
    };
    let mut y = paint_section_label(cx, theme, section_title, x, y, width);
    let row_w = width - PAD_X * 2.0;
    let row_rect = |y: f32| Rect {
        origin: Point2D::new(x + PAD_X, y),
        size: Point2D::new(row_w, INPUT_HEIGHT),
    };
    let textarea_rect = |y: f32| Rect {
        origin: Point2D::new(x + PAD_X, y),
        size: Point2D::new(row_w, TEXTAREA_HEIGHT),
    };

    // Row 1: Semantic Role (single-line input, as requested: "除了role")
    paint_input_with_prefix_and_placeholder(
        cx,
        theme,
        row_rect(y),
        if is_zh { "角色" } else { "Role" },
        edit.value_for(PropertyFocus::NodeRole, &snapshot.role),
        if is_zh {
            "如 button / navbar / card"
        } else {
            "e.g. button, navbar"
        },
        edit.focus == Some(PropertyFocus::NodeRole),
        edit.caret_at(PropertyFocus::NodeRole),
        edit.select_all_at(PropertyFocus::NodeRole),
        edit.input_at(PropertyFocus::NodeRole),
        edit.now_ms,
    );
    y += INPUT_HEIGHT + 6.0;

    if let Some(screen) = &interactions.screen {
        paint_input_with_prefix_focused_state(
            cx,
            theme,
            row_rect(y),
            translate(locale, "interactions.screen", "Screen"),
            edit.value_for(PropertyFocus::ScreenPath, screen),
            edit.focus == Some(PropertyFocus::ScreenPath),
            edit.caret_at(PropertyFocus::ScreenPath),
            edit.select_all_at(PropertyFocus::ScreenPath),
            edit.input_at(PropertyFocus::ScreenPath),
            edit.now_ms,
        );
        y += INPUT_HEIGHT + 6.0;
    }

    // Textarea 1: Interaction Action description (no longer a dropdown)
    paint_textarea_with_label(
        cx,
        theme,
        textarea_rect(y),
        if is_zh { "交互动作" } else { "Interaction" },
        edit.value_for(
            PropertyFocus::NodeInteractionDesc,
            &snapshot.interaction_desc,
        ),
        if is_zh {
            "描述当前动作，如：点击进入详情、返回上一页、跳转新页面"
        } else {
            "Describe action, e.g. open details, go back, navigate"
        },
        edit.focus == Some(PropertyFocus::NodeInteractionDesc),
        edit.caret_at(PropertyFocus::NodeInteractionDesc),
        edit.select_all_at(PropertyFocus::NodeInteractionDesc),
        edit.input_at(PropertyFocus::NodeInteractionDesc),
        edit.now_ms,
    );
    y += TEXTAREA_HEIGHT + 6.0;

    // Textarea 2: Accessibility Label / aria-label
    paint_textarea_with_label(
        cx,
        theme,
        textarea_rect(y),
        if is_zh {
            "无障碍说明 (aria-label)"
        } else {
            "Accessibility (aria-label)"
        },
        edit.value_for(PropertyFocus::NodeA11yLabel, &snapshot.a11y_label),
        if is_zh {
            "供读屏器与 AI 识别的元素名称与无障碍语义"
        } else {
            "Screen reader & AI accessible label"
        },
        edit.focus == Some(PropertyFocus::NodeA11yLabel),
        edit.caret_at(PropertyFocus::NodeA11yLabel),
        edit.select_all_at(PropertyFocus::NodeA11yLabel),
        edit.input_at(PropertyFocus::NodeA11yLabel),
        edit.now_ms,
    );
    y += TEXTAREA_HEIGHT + 6.0;

    // Textarea 3: Design Note / Explain
    paint_textarea_with_label(
        cx,
        theme,
        textarea_rect(y),
        if is_zh { "设计注释" } else { "Design Note" },
        edit.value_for(PropertyFocus::NodeExplain, &snapshot.explain),
        if is_zh {
            "补充业务意图、布局约束或代码还原说明"
        } else {
            "Intent, layout constraints, or codegen notes"
        },
        edit.focus == Some(PropertyFocus::NodeExplain),
        edit.caret_at(PropertyFocus::NodeExplain),
        edit.select_all_at(PropertyFocus::NodeExplain),
        edit.input_at(PropertyFocus::NodeExplain),
        edit.now_ms,
    );
    y += TEXTAREA_HEIGHT + 6.0;
    y += 6.0;
    paint_section_divider(cx, theme, x, y, width);
    y + SECTION_GAP
}

// ── Navigate/Back/Remove edit menu ──────────────────────────────────

pub(crate) const INTERACTION_MENU_ROW_H: f32 = 30.0;
pub(crate) const INTERACTION_MENU_W: f32 = 200.0;

/// Hit-result for a click on the open Navigate/Back/Remove menu.
#[derive(Debug, Clone, PartialEq)]
pub enum InteractionMenuHit {
    Row(PropertyPanelAction),
    Inside,
    Outside,
}

/// Menu rows in paint order: one "Navigate to <path>" row per screen
/// path authored on the current page, then "Back (pop)", then
/// "Remove" (only when there is an existing action to remove).
pub(crate) fn interaction_menu_rows(
    locale: op_editor_core::Locale,
    screen_paths: &[String],
    removable: bool,
) -> Vec<(PropertyPanelAction, String)> {
    let navigate_to = translate(locale, "interactions.navigateTo", "Navigate to");
    let mut rows: Vec<(PropertyPanelAction, String)> = screen_paths
        .iter()
        .map(|path| {
            (
                PropertyPanelAction::SetInteractionNavigate { path: path.clone() },
                format!("{navigate_to} {path}"),
            )
        })
        .collect();
    rows.push((
        PropertyPanelAction::SetInteractionPop,
        translate(locale, "interactions.back", "Back (pop)").to_string(),
    ));
    if removable {
        rows.push((
            PropertyPanelAction::RemoveInteraction,
            translate(locale, "interactions.remove", "Remove").to_string(),
        ));
    }
    rows
}

/// The menu popover rect, anchored to the tap row's rect (drops just
/// below it, right-aligned — matches `effect_add_menu_rect`).
pub(crate) fn interaction_menu_rect(anchor: Rect, row_count: usize) -> Rect {
    let h = row_count as f32 * INTERACTION_MENU_ROW_H + 8.0;
    let right = anchor.origin.x + anchor.size.x;
    Rect {
        origin: Point2D::new(right - INTERACTION_MENU_W, anchor.origin.y + anchor.size.y),
        size: Point2D::new(INTERACTION_MENU_W, h),
    }
}

/// `(action, row_rect)` for each menu row, given the menu rect.
pub(crate) fn interaction_menu_row_rects(
    menu: Rect,
    rows: &[(PropertyPanelAction, String)],
) -> Vec<(PropertyPanelAction, Rect)> {
    rows.iter()
        .enumerate()
        .map(|(i, (action, _))| {
            let ry = menu.origin.y + 4.0 + i as f32 * INTERACTION_MENU_ROW_H;
            (
                action.clone(),
                Rect {
                    origin: Point2D::new(menu.origin.x, ry),
                    size: Point2D::new(menu.size.x, INTERACTION_MENU_ROW_H),
                },
            )
        })
        .collect()
}

/// Paint the Navigate/Back/Remove popover anchored to `anchor` (the
/// tap row's rect). `hover` highlights the row index under the
/// cursor, matching the Effects add-menu's `paint_effect_add_menu`.
pub(crate) fn paint_interaction_menu(
    cx: &mut PaintCx<'_>,
    theme: &Theme,
    anchor: Rect,
    rows: &[(PropertyPanelAction, String)],
    hover: Option<usize>,
) {
    let menu = interaction_menu_rect(anchor, rows.len());
    cx.backend
        .fill_round_rect(menu, INPUT_RADIUS, theme.popover);
    cx.backend
        .stroke_round_rect(menu, INPUT_RADIUS, theme.border, 1.0);
    for (i, (_, label)) in rows.iter().enumerate() {
        let ry = menu.origin.y + 4.0 + i as f32 * INTERACTION_MENU_ROW_H;
        if hover == Some(i) {
            let row = Rect {
                origin: Point2D::new(menu.origin.x + 4.0, ry),
                size: Point2D::new(menu.size.x - 8.0, INTERACTION_MENU_ROW_H),
            };
            cx.backend.fill_round_rect(row, 6.0, theme.muted);
        }
        let text = TextLayout::single_run(
            label,
            "system-ui",
            12.0,
            theme.foreground.to_jian(),
            Point2D::new(0.0, 0.0),
        );
        cx.backend.draw_text(
            &text,
            Point2D::new(
                menu.origin.x + 12.0,
                ry + INTERACTION_MENU_ROW_H / 2.0 + 4.0,
            ),
        );
    }
}

fn translate(
    locale: op_editor_core::Locale,
    key: &'static str,
    fallback: &'static str,
) -> &'static str {
    let translated = crate::i18n::translate(locale, key);
    if translated == key {
        fallback
    } else {
        translated
    }
}

#[cfg(test)]
#[path = "property_panel_interactions_tests.rs"]
mod tests;
