//! TS-compatible `get_design_prompt` MCP tool.

use std::collections::BTreeMap;

use op_editor_core::{DesignMdSpec, EditorState};

use super::{McpTool, ToolErrorCode, ToolOutcome};

const PROMPT_SECTIONS: &[&str] = &[
    "all",
    "schema",
    "layout",
    "roles",
    "text",
    "style",
    "icons",
    "examples",
    "guidelines",
    "quality",
    "mobile",
    "planning",
    "elements",
    "elements-cookbook",
    "design-md",
    "copywriting",
    "overflow",
    "cjk",
    "variables",
    "design-tools",
    "codegen-planning",
    "codegen-chunk",
    "codegen-assembly",
    "codegen-react",
    "codegen-vue",
    "codegen-svelte",
    "codegen-html",
    "codegen-flutter",
    "codegen-swiftui",
    "codegen-compose",
    "codegen-react-native",
];

const INTRO: &str = r#"You are working with OpenPencil, a vector design tool.

TOOL SELECTION - match the user's intent:
- READ/INSPECT the canvas: read_nodes, snapshot_layout, get_selection, get_node
- CREATE new designs: batch_design, design_skeleton, design_content, design_refine
- MODIFY existing nodes: update_node, replace_node, set_node_* tools
- DELETE/REMOVE elements: delete_node after inspecting the target id
- MOVE/COPY: move_node, copy_node, copy_selected

When the user asks to read or inspect existing content, use read tools first.
Each node must follow the PenNode schema and stay under the root frame."#;

const PLANNING_GUIDE: &str = r#"DESIGN PLANNING:
- Classify by purpose: marketing/informational pages use desktop 1200px wide scrollable roots; single-task screens use mobile 375x812; dashboards/admin workspaces use desktop layouts.
- Create a skeleton first, fill each section with content, then refine.
- Keep forms together with their primary action. Split only when one section would be too large.
- Default to light neutral styling unless the request explicitly asks for dark, cyber, neon, terminal, noir, night, or similar themes.
- Responsive / multi-device requests: design one screen per breakpoint with upsert_screen (keys such as page-large, page-medium, page-small) and share the same components, styles and variables across them.
  - Large >=1280 (e.g. 1440 wide): persistent left navigation/sidebar and right detail panel beside the main content.
  - Medium 768-1279 (e.g. 1024 wide): keep only one side panel expanded at a time; the other collapses to an icon rail or toggle.
  - Small <768 (e.g. 390 wide): content-first single column; secondary panels become bottom sheets and navigation moves to a tab bar or menu."#;

const AESTHETIC_QUALITY_GUIDE: &str = r#"AESTHETIC QUALITY BAR:
- Avoid crowded output. Prefer fewer, stronger modules with visible negative space over filling every pixel.
- Mobile screens should use one App Content wrapper for the main body. The wrapper owns horizontal padding (16-20px) and vertical gap (20-24px); inner sections should not each add competing gutters.
- Mobile top rhythm: keep the header/title group and first primary module close. On 375-430px screens, the gap from a greeting/title/header cluster to search, primary action, chart, or first card should usually be 20-32px. Do not leave a blank hero-sized band above the first useful control unless the request explicitly asks for an editorial hero.
- Keep one primary job per screen. Above the fold, show the title/context, the primary action or search, and at most 2-3 supporting modules.
- Use a clear type rhythm: one display/title size, one section heading size, one body/caption size. Avoid many near-identical bold text sizes.
- Reuse one card radius, one card padding, and one shadow treatment within a screen.
- Use at most two saturated colors. Let hierarchy come from spacing, contrast, and content scale, not decoration.
- Product card favorite/heart controls must stay fully inside its card or image with an 8-12px inset. Treat favorite/heart as a functional icon-button, not a floating badge; never use negative x/y, straddle the card edge, or let it overlap the section heading row.
- Mobile tab bars are part of the page flow; do not add fake bottom spacers or overlays.
- Pick a distinct visual concept for each new design and build around one signature moment. Do not repeat the same predictable mobile stack of search + categories + orange promo + two cards unless the prompt specifically calls for that pattern.
- Use the user's domain to vary composition, imagery, palette, rhythm, and interaction affordances; polish should feel intentional rather than template-derived."#;

const RUST_ELEMENT_TOOL_GUIDE: &str = r##"RUST MCP ELEMENT TOOL COMPATIBILITY:
- This Rust MCP server does not expose the TS `add_*_v1` element-tool family unless those exact tools appear in tools/list. Do not call `add_*` tools just because older prompt text or examples mention them.
- CREATE custom UI trees with `batch_design.script` (script-first). The sandboxed JavaScript program may call only `I(parent, nodeObject)` for custom PenNodes and `K("starter/<id>"|"shadcn/<id>"|"<kit>/<component>", parent, overrides?)` for UIKit components. Use loops, helpers, and data arrays inside the script; bindings are ordinary JavaScript variables whose returned node ids can be used by later edit batches.
- `parent` may be `null` for the active page root, a previous `I()`/`K()` result, or one real existing parent id. Node objects use canonical PenNode fields and may omit `id`, because Rust remaps inserted ids.
- Use `batch_design.operations` ONLY to edit existing nodes after inspection or verification. Supported edit/refine operations are one-at-a-time `U(nodeId, patchJson)`, `D(nodeId)`, `M(nodeId, parent, index?)`, `binding=C(sourceId, parent, overrides?)`, `binding=R(nodeId, nodeJson)`, and `binding=G(slotIdOrBinding, "search"|"generate", prompt[, "append"])`. Do not create fresh UI trees with `I()` in operations.
- The default 3-argument `G` is strict slot-fill: its target must exist and have zero children. The explicit fourth argument `"append"` is accepted only on a parent that declares layout `"horizontal"` or `"vertical"`; it never overlays a layout-none/omitted parent. Size the appended binding with `U()` in the same edit batch.
- `U` currently patches geometry/name/fill fields; use dedicated `set_node_*` tools for text, rotation, stroke, font, effects, and other specialized fields.

Example:
`batch_design({script: `
const root = I(null, {type:"frame",name:"Page",width:1200,height:800,layout:"vertical",gap:24,fill:"#ffffff"});
const hero = I(root, {type:"frame",name:"Hero",width:"fill_container",height:360,layout:"vertical",gap:16});
I(hero, {type:"text",name:"Headline",content:"Welcome Back",width:"fill_container",height:64,fontSize:48,fontWeight:700});
K("shadcn/btn-primary", hero, {label:"Get started"});
`})`

Light/dark handling:
- Inspect `get_variables` / `get_active_theme` first when the document already defines theme axes.
- Use the document's own variables when it defines them. Otherwise reference Talkdesk Cobalt library variables such as `$--surface-elevation-0`, `$--text-default` and `$--primary-9`; they import on first use and follow the `Color scheme (Primitives)` Light/Dark axis.
- If the user explicitly asks for a one-off design in another style, use concrete high-contrast fills and text colors directly."##;

/// Element guide for hosts built without QuickJS (the wasm DSH engine):
/// `batch_design.script` is unavailable there, so trees are built with the
/// operations-DSL insert grammar instead.
const OPERATIONS_ELEMENT_TOOL_GUIDE: &str = r##"RUST MCP ELEMENT TOOL COMPATIBILITY:
- This Rust MCP server does not expose the TS `add_*_v1` element-tool family unless those exact tools appear in tools/list. Do not call `add_*` tools just because older prompt text or examples mention them.
- This host has no script engine: `batch_design.script` and `K()` UIKit calls are rejected. Build custom UI trees with `batch_design.operations` insert programs instead (operations-first).
- An insert program is one `binding=I(parent, nodeJson)` per line. `parent` is `null` for the active page root, an earlier binding from the same program, or one real existing parent id. `nodeJson` is strict JSON using canonical PenNode fields (quote every key) and may omit `id`, because Rust remaps inserted ids. Nested `children` arrays are allowed. The whole program is atomic.
- Keep insert programs and edits in separate batch_design calls. Edit existing nodes after inspection with one-at-a-time `U(nodeId, patchJson)`, `D(nodeId)`, `M(nodeId, parent, index?)`, `binding=C(sourceId, parent, overrides?)`, `binding=R(nodeId, nodeJson)`, and `binding=G(slotIdOrBinding, "search"|"generate", prompt[, "append"])`.
- The default 3-argument `G` is strict slot-fill: its target must exist and have zero children. The explicit fourth argument `"append"` is accepted only on a parent that declares layout `"horizontal"` or `"vertical"`; it never overlays a layout-none/omitted parent.
- `U` currently patches geometry/name/fill fields; use dedicated `set_node_*` tools for text, rotation, stroke, font, effects, and other specialized fields.

Example:
`batch_design({operations: `
root=I(null, {"type":"frame","name":"Page","width":1200,"height":800,"layout":"vertical","gap":24,"fill":"#ffffff"})
hero=I(root, {"type":"frame","name":"Hero","width":"fill_container","height":360,"layout":"vertical","gap":16})
title=I(hero, {"type":"text","name":"Headline","content":"Welcome Back","width":"fill_container","height":64,"fontSize":48,"fontWeight":700})
`})`

Light/dark handling:
- Inspect `get_variables` / `get_active_theme` first when the document already defines theme axes.
- Use the document's own variables when it defines them. Otherwise reference Talkdesk Cobalt library variables such as `$--surface-elevation-0`, `$--text-default` and `$--primary-9`; they import on first use and follow the `Color scheme (Primitives)` Light/Dark axis.
- If the user explicitly asks for a one-off design in another style, use concrete high-contrast fills and text colors directly."##;

fn element_tool_guide() -> &'static str {
    if cfg!(feature = "script") {
        RUST_ELEMENT_TOOL_GUIDE
    } else {
        OPERATIONS_ELEMENT_TOOL_GUIDE
    }
}

const DEFAULT_DESIGN_MD: &str = "No design.md loaded in the current document.";

const DESIGN_TOOL_GUIDE: &str = r#"DESIGN TOOL WORKFLOW:
- Use tool_search(query) to discover current tools and their authoritative schemas. Inspect read_nodes/snapshot_layout before editing. Never infer a tool or property from older examples.
- Reuse persistent styles: list_styles -> create_style/apply_style; update_style propagates to attached nodes, detach_style retains the authored appearance. Styles accept canonical paint/text/effect properties.
- Import/export DTCG variables with import_design_tokens/export_design_tokens. Bind explicit nodeIds using bind_variable; unbind_variable retains the resolved value. Typed bindings include visible/enabled, text properties and existing effect paths such as effects.0.blur (shadow) or effects.0.radius (blur). Unsupported fields, types and effect indexes reject atomically. get_variable_mode inspects explicit/resolved modes; set_variable_mode scopes node/page/global. Empty modes clears overrides; mode auto removes an axis override. Resolution inherits defaults -> global -> preview -> page -> ancestor/node. evaluate_variable uses the renderer's alias/calc solver. Number variable values can be strings such as calc($spacing * 2). Reject invalid modes, cycles and nonfinite formulas instead of inventing fallback values.
- Formula scales: define one base and derive the rest so the system stays coherent, e.g. set_variables({"variables":{"space-base":{"type":"number","value":8},"space-lg":{"type":"number","value":"calc($space-base * 2)"},"font-body":{"type":"number","value":16},"font-h1":{"type":"number","value":"calc($font-body * 2)"}}}) -> bind_variable({"nodeIds":[frameId],"property":"gap","variable":"space-lg"}) -> evaluate_variable({"id":"space-lg"}) to confirm the resolved value. Changing space-base then rescales every bound node.
- Components: create_component on an authored frame, add_component_property for text/visibility/instance-swap, then set_instance_properties on a Ref. reset_instance_properties(instanceId, properties?: string[]) removes named values to restore defaults; omit properties to reset all, preserving descendant overrides. create_slot/list_slots/fill_slot target named containers without changing master content. create_slot rejects duplicate names; update_slot(componentId, name, targetId, min?, max?) replaces an existing slot contract (min defaults to 0; omitted max is unbounded) and validates every referencing instance fill. delete_slot(componentId, name) removes only the definition, preserving containers and descendant overrides. These tools target explicit IDs without requiring UI selection. create_variant promotes an already-designed frame; list_variants/set_instance_variant choose within a family. Variant switching clears incompatible overrides.
- Interaction: get_component_behaviour/set_component_behaviour author validated button/switch/checkbox/tabs/slider state. Bind state to existing typed component properties or family variants. Nested interactive behaviours and instance-swap bindings are rejected. Preview changes transient instance visuals, not the authored document.
- Behaviour example (switch): design the on/off visuals in one frame, create_component, expose the "on" layer as a boolean property, then set_component_behaviour({"componentId":id,"behaviour":{"kind":"switch","defaultValue":false,"stateBindings":[{"type":"property","propertyId":"checked"}]}}). Use kind button for actions, checkbox/switch for booleans, tabs for one-of-many (bind to a variant family) and slider for ranges. Confirm with get_component_behaviour (executable:true). Only HTML/CSS and React Tailwind exports emit the interactive state and ARIA.
- Export: export_code(format:html-css|tailwind-jsx|design-jsx,nodeIds?) returns deterministic code for the active page or explicit real node IDs. HTML/CSS and React Tailwind JSX include supported interactive state and ARIA. This is read-only, not AI execution or a file write.
- View: get_viewport/set_viewport use pan_x/pan_y and zoom_percent strings. Saved editorMeta.viewport preserves fractional browser pan and bounded zoom; view-only changes do not dirty content or enter undo history. Do not confuse camera zoom with UI scaling.
- UI: get_ui_scale/set_ui_scale control actual chrome/layout/hit-testing at scale 100, 110, 125 or 150. This is separate from document geometry and camera zoom, and does not create document edits. Managed browsers acknowledge the requested preference asynchronously.
- Color: sample_color({x,y}|{nodeId}) reads actual CanvasKit-composited RGBA8/hex, not model fills. It requires an open synchronized Node-hosted editor; move offscreen targets into view and wait for image decoding. Sampling excludes chrome/grid/selection and does not edit content. Never invent a sampled color after an error.
- Recovery: list_drafts inspects persistent snapshots for the parent-bound file and returns currentVersion for optional stale-write protection. create_draft(label?) checkpoints before risky edits; restore_draft(id,baseVersion?) creates a protective backup and one undoable edit without saving the bound file. Inspect the chosen snapshot's metadata before restoring; recovery is never automatic. delete_draft discards an unwanted snapshot. Live edits are autosaved per session; a draft-write-failed error with applied:true means the live edit landed but its recovery copy did not.
- Text: set_node_text(markdown:true) or set_text_markdown converts the supported Markdown subset into styled content. get_text_style before set_text_style(start,end,style); offsets count Unicode scalars, not UTF-8 bytes or UTF-16 code units. Range fontFamily is rendered and persisted; empty clears the override. Mixed-size/family runs wrap using their actual metrics. set_paragraph_style applies list/paragraph formatting.
- Geometry: copy_properties/paste_properties copy appearance, not content/identity/placement. update_node data.lockAspectRatio locks proportional resizing. arrange_nodes operates only on eligible free-moving siblings, never flex-flow children. set_vector_path validates SVG geometry; ellipse arcs and flips use their existing tools.
- Geometry in batch_design inserts: rings/gauges/donut charts are ellipses with innerRadius (0-1 ratio), startAngle and sweepAngle in degrees, e.g. ring=I(card, {"type":"ellipse","width":120,"height":120,"innerRadius":0.7,"startAngle":-90,"sweepAngle":270}). Icons and custom shapes are paths with an SVG d starting with M plus fillRule nonzero|evenodd, e.g. icon=I(card, {"type":"path","width":24,"height":24,"d":"M4 12 L10 18 L20 6","fillRule":"evenodd"}). Mirror with "flipX"/"flipY":true instead of redrawing. Malformed d or fillRule rejects the whole batch.
- Web page import: import_html(htmlPath or html) and import_html_url(url) render the page in headless Chrome (scripts, web fonts, WebGL canvas pixels, native controls) and import the computed layout; pass viewports:[1440,768,390] for one board per breakpoint and readyExpression/waitMs for late-rendering pages. Check renderMode (static-css means no Chrome: lower fidelity) and warnings, then compare_html_fidelity({nodeId:rootIds[0],htmlPath}) and report its ratio/bands/missing text honestly; verified:true is the bar.
- Imports: paste_html(mode:text|layers), import_mermaid(flowchart subset), import_drawio(single flat XML or bounded compressed diagram). create_connector creates static editable geometry; it does NOT follow moved endpoints.
- For a whole-file Figma migration, prefer a user-exported .fig local copy with import_figma(figPath), and keep REST link import as a supplement for selected nodes and automation. Neither path guarantees pixel parity: verify with get_screenshot and compare_figma_fidelity using the original Figma URL. The official REST API does not provide a raw .fig download endpoint; do not pretend its JSON is a .fig file.
- Figma import: for a figma.com link call inspect_figma_node(url) first when the target may be large (a parent with many boards); import_figma(url) then runs a chunked job (parent frame first, one board per request, oversized boards split, cached and resumable). If it returns status:"running", poll get_figma_import_status({jobId,waitMs:20000}) until succeeded/partial/failed — never re-run import_figma for the same link while a job runs. For partial/failed, read failed[].code: FIGMA_TIMEOUT/FIGMA_NODE_TOO_LARGE -> resume_figma_import (or import fewer nodeIds); FIGMA_RATE_LIMITED -> wait then resume; FIGMA_AUTH -> ask for a token. Imports insert beside existing content (or at x/y/parent) and the editor frames them automatically. Keep layout:"preserve" for pixel fidelity; use "semantic" only when the user wants responsive Hug/Fill structure. After importing, compare_figma_fidelity({url,nodeId:rootIds[0]}) and fix the reported nodes (font, truncation, size) until the diff is small; report remaining differences honestly.
- Quality: lint_document(rules,nodeIds) -> fix_lint_issues(issueIds) is one undoable transaction. Re-lint after edits because issue IDs encode observed values. Advisory findings need authored design decisions; do not report them as automatically fixed.
- Prototyping: wire multi-screen flows with Figma-compatible prototype tools: set_prototype({flows:[{nodeId,name}],device}), set_reactions({nodeId,reactions:[{trigger:{type:"ON_CLICK"},actions:[{type:"NODE",destinationId,navigation:"NAVIGATE"|"OVERLAY"|"SWAP"|"CHANGE_TO"|"SCROLL_TO",transition:{type:"SMART_ANIMATE"|"DISSOLVE"|"MOVE_IN"|"PUSH"|"SLIDE_IN",duration:0.3}}]}]}), set_scroll_behavior({nodeId,overflowDirection:"VERTICAL"|"HORIZONTAL"|"BOTH",scrollBehavior:"SCROLLS"|"FIXED"|"STICKY",overlay}), and verify flows with get_prototype and simulate_prototype({steps:[{type:"click",node_id}]}).
- Visual verification loop: after generating a screen or making a major edit, call get_screenshot({nodeId:screenId}) (or no nodeId for the whole page) and inspect the image for overlap, clipped or truncated text, low contrast, misalignment and broken hierarchy. Fix what you see, then screenshot again; stop after about 3 rounds and report anything still unresolved. get_screenshot needs an open synchronized editor; if it errors, fall back to snapshot_layout plus get_design_quality and say that visual output was not checked. Never describe a screenshot you did not receive.
- Verify actual layout and save/reopen persistence. Tool registration or a successful write is not proof of visual fidelity."#;

pub struct GetDesignPrompt {
    design_md_policy: Option<String>,
}

impl McpTool for GetDesignPrompt {
    fn name(&self) -> &str {
        "get_design_prompt"
    }

    fn call(&self, args: &BTreeMap<String, String>) -> ToolOutcome {
        let section = args.get("section").map(String::as_str).unwrap_or("all");
        let available = match serde_json::to_string(PROMPT_SECTIONS) {
            Ok(json) => json,
            Err(e) => {
                return ToolOutcome::Err(
                    ToolErrorCode::Internal,
                    format!("serialize prompt sections failed: {e}"),
                );
            }
        };
        let mut out = BTreeMap::new();
        out.insert("section".into(), section.into());
        out.insert("availableSections".into(), available);
        out.insert(
            "designPrompt".into(),
            build_design_prompt(Some(section), self.design_md_policy.as_deref()),
        );
        ToolOutcome::Ok(out)
    }
}

pub fn get_design_prompt_snapshot(state: &EditorState) -> GetDesignPrompt {
    GetDesignPrompt {
        design_md_policy: state
            .doc
            .design_md
            .as_ref()
            .map(build_design_md_style_policy)
            .filter(|policy| !policy.is_empty()),
    }
}

fn build_design_prompt(section: Option<&str>, design_md_policy: Option<&str>) -> String {
    if let Some(section) = section {
        if let Some(policy) = design_md_policy {
            if section == "style" {
                return format!("DESIGN SYSTEM (from design.md):\n{policy}");
            }
            if section == "design-md" {
                return policy.to_string();
            }
        }
        if let Some(content) = section_content(section) {
            return content;
        }
    }
    build_full_prompt()
}

fn section_content(section: &str) -> Option<String> {
    match section {
        "all" => Some(build_full_prompt()),
        "schema" => Some(skill_content("schema")),
        "layout" => Some(skill_content("layout")),
        "roles" => Some(skill_content("role-definitions")),
        "text" => Some(skill_content("text-rules")),
        "style" => Some(skill_content("style-defaults")),
        "icons" => Some(skill_content("icon-catalog")),
        "examples" => Some(skill_content("examples")),
        "guidelines" => Some(format!(
            "{}\n\n{}",
            skill_content("design-principles"),
            skill_content("product-principles")
        )),
        "quality" => Some(AESTHETIC_QUALITY_GUIDE.into()),
        "mobile" => Some(skill_content("mobile-app")),
        "planning" => Some(PLANNING_GUIDE.into()),
        "elements" => Some(element_tool_guide().into()),
        "elements-cookbook" => Some(element_tool_guide().into()),
        "design-md" => Some(DEFAULT_DESIGN_MD.into()),
        "copywriting" => Some(skill_content("copywriting")),
        "overflow" => Some(skill_content("overflow")),
        "cjk" => Some(skill_content("cjk-typography")),
        "variables" => Some(skill_content("variables")),
        "design-tools" => Some(DESIGN_TOOL_GUIDE.into()),
        "codegen-planning" => Some(skill_content("codegen-planning")),
        "codegen-chunk" => Some(skill_content("codegen-chunk")),
        "codegen-assembly" => Some(skill_content("codegen-assembly")),
        "codegen-react" => Some(skill_content("codegen-react")),
        "codegen-vue" => Some(skill_content("codegen-vue")),
        "codegen-svelte" => Some(skill_content("codegen-svelte")),
        "codegen-html" => Some(skill_content("codegen-html")),
        "codegen-flutter" => Some(skill_content("codegen-flutter")),
        "codegen-swiftui" => Some(skill_content("codegen-swiftui")),
        "codegen-compose" => Some(skill_content("codegen-compose")),
        "codegen-react-native" => Some(skill_content("codegen-react-native")),
        _ => None,
    }
}

fn build_full_prompt() -> String {
    [
        INTRO,
        &skill_content("schema"),
        &skill_content("style-defaults"),
        &skill_content("examples"),
        PLANNING_GUIDE,
        AESTHETIC_QUALITY_GUIDE,
        &skill_content("mobile-app"),
        &skill_content("role-definitions"),
        &skill_content("layout"),
        &skill_content("text-rules"),
        &skill_content("design-principles"),
        &skill_content("variables"),
        element_tool_guide(),
        DESIGN_TOOL_GUIDE,
    ]
    .join("\n\n")
}

fn skill_content(name: &str) -> String {
    op_ai_skills::get_skill_by_name(name)
        .map(|skill| skill.content.clone())
        .unwrap_or_default()
}

fn build_design_md_style_policy(spec: &DesignMdSpec) -> String {
    let mut parts = Vec::new();

    if let Some(theme) = spec.visual_theme.as_ref().filter(|s| !s.is_empty()) {
        parts.push(format!("VISUAL THEME: {}", truncate_chars(theme, 200)));
    }

    if let Some(palette) = spec
        .color_palette
        .as_ref()
        .filter(|colors| !colors.is_empty())
    {
        let colors = palette
            .iter()
            .take(10)
            .map(|c| format!("{} ({}) — {}", c.name, c.hex, c.role))
            .collect::<Vec<_>>()
            .join("\n- ");
        parts.push(format!("COLOR PALETTE:\n- {colors}"));

        let surfaces = palette
            .iter()
            .filter(|c| {
                let role = c.role.to_lowercase();
                ["surface", "card", "panel", "sidebar", "tile", "chip"]
                    .iter()
                    .any(|needle| role.contains(needle))
            })
            .take(6)
            .map(|c| format!("{} ({}) — {}", c.name, c.hex, c.role))
            .collect::<Vec<_>>();
        if !surfaces.is_empty() {
            parts.push(format!(
                "SURFACE COLORS (use ONLY as `fill` on visually distinct components placed on top \
                 of the page background — cards, sidebars, floating panels, chips, badges. DO NOT \
                 fill section root frames or generic wrapper frames with these; section containers \
                 must stay transparent and inherit the page background. NEVER use these as the \
                 page/rootFrame fill):\n- {}",
                surfaces.join("\n- ")
            ));
        }
    }

    if let Some(typography) = &spec.typography {
        if let Some(font) = typography.font_family.as_ref().filter(|s| !s.is_empty()) {
            parts.push(format!("FONT: {font}"));
        }
        if let Some(headings) = typography.headings.as_ref().filter(|s| !s.is_empty()) {
            parts.push(format!("Headings: {headings}"));
        }
        if let Some(body) = typography.body.as_ref().filter(|s| !s.is_empty()) {
            parts.push(format!("Body: {body}"));
        }
    }

    if let Some(styles) = spec.component_styles.as_ref().filter(|s| !s.is_empty()) {
        parts.push(format!(
            "COMPONENT STYLES:\n{}",
            truncate_chars(styles, 300)
        ));
    }
    if let Some(layout) = spec.layout_principles.as_ref().filter(|s| !s.is_empty()) {
        parts.push(format!(
            "LAYOUT PRINCIPLES:\n{}",
            truncate_chars(layout, 400)
        ));
    }
    if let Some(notes) = spec.generation_notes.as_ref().filter(|s| !s.is_empty()) {
        parts.push(format!("GENERATION NOTES:\n{}", truncate_chars(notes, 400)));
    }

    parts.join("\n\n")
}

fn truncate_chars(s: &str, max: usize) -> String {
    if s.chars().count() > max {
        format!("{}...", s.chars().take(max).collect::<String>())
    } else {
        s.to_string()
    }
}
