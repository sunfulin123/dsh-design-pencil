//! Accessible DOM action anchored to the CanvasKit top bar's Palette slot.

use std::cell::Cell;
use wasm_bindgen::{closure::Closure, JsCast};
use web_sys::{HtmlCanvasElement, HtmlElement};

use op_editor_core::bridge_protocol::RefreshState;
use op_editor_core::editor_ui_state::EditorUiState;
use op_editor_ui::widgets::{host_overlay_geometry, icons::Icon, TopBar};
use op_editor_ui::Color;

thread_local! {
    static FEEDBACK: Cell<Option<RefreshState>> = const { Cell::new(None) };
}

pub(crate) fn enable(enabled: bool) {
    FEEDBACK.with(|value| match (enabled, value.get()) {
        (true, None) => value.set(Some(RefreshState::Idle)),
        (false, Some(_)) => value.set(None),
        _ => return,
    });
    crate::repaint_coalescer::request();
}

pub(crate) fn feedback(status: RefreshState) {
    FEEDBACK.with(|value| {
        if value.get().is_some() {
            value.set(Some(status));
            crate::repaint_coalescer::request();
        }
    });
}

pub(super) struct RefreshToolbar {
    root: HtmlElement,
    button: HtmlElement,
    tooltip: HtmlElement,
    announce: HtmlElement,
    appearance: Option<String>,
    status: Option<RefreshState>,
    _click: Closure<dyn FnMut(web_sys::Event)>,
    _keyboard: Closure<dyn FnMut(web_sys::KeyboardEvent)>,
}

impl RefreshToolbar {
    fn create(canvas: &HtmlCanvasElement) -> Option<Self> {
        let doc = canvas.owner_document()?;
        let root = doc
            .create_element("div")
            .ok()?
            .dyn_into::<HtmlElement>()
            .ok()?;
        root.set_attribute("data-op-refresh-toolbar", "").ok()?;
        let paths: String = Icon::RefreshCw
            .paths()
            .iter()
            .map(|path| format!(r#"<path d="{path}"/>"#))
            .collect();
        root.set_inner_html(&format!(r#"<style>{CSS}</style>
          <button type="button" data-op-refresh-canvas aria-label="Refresh canvas" aria-describedby="op-refresh-description">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{paths}</svg>
          </button>
          <span data-op-refresh-tip aria-hidden="true">Refresh canvas</span>
          <span id="op-refresh-description" data-op-refresh-announcement role="status"></span>"#));
        let button = root
            .query_selector("button")
            .ok()??
            .dyn_into::<HtmlElement>()
            .ok()?;
        let tooltip = root
            .query_selector("[data-op-refresh-tip]")
            .ok()??
            .dyn_into::<HtmlElement>()
            .ok()?;
        let announce = root
            .query_selector("[data-op-refresh-announcement]")
            .ok()??
            .dyn_into::<HtmlElement>()
            .ok()?;
        let click = Closure::<dyn FnMut(web_sys::Event)>::new(|event: web_sys::Event| {
            event.stop_propagation();
            let Some(status) = FEEDBACK.with(Cell::get) else {
                return;
            };
            if status == RefreshState::Refreshing {
                return;
            }
            feedback(RefreshState::Refreshing);
            crate::vscode_bridge::post_to_parent(r#"{"type":"op-shell/refresh-canvas"}"#);
        });
        button
            .add_event_listener_with_callback("click", click.as_ref().unchecked_ref())
            .ok()?;
        let keyboard =
            Closure::<dyn FnMut(web_sys::KeyboardEvent)>::new(|event: web_sys::KeyboardEvent| {
                if matches!(event.key().as_str(), "Enter" | " ") {
                    // Preserve the HTML button's native activation instead of the canvas key bindings.
                    event.stop_propagation();
                }
            });
        for event in ["keydown", "keyup"] {
            button
                .add_event_listener_with_callback(event, keyboard.as_ref().unchecked_ref())
                .ok()?;
        }
        canvas.parent_element()?.append_child(&root).ok()?;
        Some(Self {
            root,
            button,
            tooltip,
            announce,
            appearance: None,
            status: None,
            _click: click,
            _keyboard: keyboard,
        })
    }

    fn layout(&mut self, canvas: &HtmlCanvasElement, ui: &EditorUiState, w: f32, h: f32) {
        let topbar = TopBar::for_editor_ui(ui);
        let scale = ui.ui_scale.factor();
        let bar = host_overlay_geometry::top_bar_rect(w / scale);
        let palette = topbar.asset_center_button_rect(bar);
        let actual = canvas.get_bounding_client_rect();
        let scale_x = f64::from(scale) * actual.width() / f64::from(w);
        let scale_y = f64::from(scale) * actual.height() / f64::from(h);
        let left = actual.left() + f64::from(palette.origin.x - palette.size.x) * scale_x;
        let center_y = bar.origin.y + bar.size.y / 2.0;
        let top = actual.top() + f64::from(center_y - palette.size.y / 2.0) * scale_y;
        let width = f64::from(palette.size.x) * scale_x;
        let height = f64::from(palette.size.y) * scale_y;
        let theme = topbar.theme;
        let appearance = format!("left:{left}px;top:{top}px;width:{width}px;height:{height}px;--op-fg:{};--op-hover:{};--op-ring:{};--op-tip-bg:{};--op-tip-fg:{};--op-tip-border:{};--op-radius:{}px;--op-icon:{}px", css_color(theme.foreground), css_color(theme.button_hover), css_color(theme.ring), css_color(theme.popover), css_color(theme.popover_foreground), css_color(theme.border), 6.0 * scale_y, 14.0 * scale_y);
        if self.appearance.as_ref() != Some(&appearance) {
            let _ = self.root.set_attribute("style", &appearance);
            self.appearance = Some(appearance);
        }
    }

    fn update_status(&mut self, status: RefreshState) {
        if self.status == Some(status) {
            return;
        }
        let label = match status {
            RefreshState::Idle => "Refresh canvas",
            RefreshState::Refreshing => "Refreshing canvas…",
            RefreshState::Updated => "Canvas updated",
            RefreshState::Current => "Canvas is up to date",
            RefreshState::Blocked => "Save or resolve local changes before refreshing",
            RefreshState::Failed => "Canvas refresh failed. Try again.",
        };
        let _ = self.button.set_attribute("data-state", status.wire());
        let _ = self.button.set_attribute(
            "aria-disabled",
            if status == RefreshState::Refreshing {
                "true"
            } else {
                "false"
            },
        );
        self.tooltip.set_text_content(Some(label));
        self.announce
            .set_text_content((status != RefreshState::Idle).then_some(label));
        self.status = Some(status);
    }
}

impl Drop for RefreshToolbar {
    fn drop(&mut self) {
        self.root.remove();
    }
}

pub(super) fn sync(
    toolbar: &mut Option<RefreshToolbar>,
    canvas: &HtmlCanvasElement,
    ui: &EditorUiState,
    w: f32,
    h: f32,
) {
    let status = FEEDBACK.with(Cell::get);
    let visible = status.is_some() && !ui.preview.mode && w > 0.0 && h > 0.0;
    if visible && toolbar.is_none() {
        *toolbar = RefreshToolbar::create(canvas);
    }
    if let Some(toolbar) = toolbar.as_mut() {
        if toolbar.root.hidden() == visible {
            toolbar.root.set_hidden(!visible);
        }
        if let Some(status) = status.filter(|_| visible) {
            toolbar.layout(canvas, ui, w, h);
            toolbar.update_status(status);
        }
    }
}

fn css_color(c: Color) -> String {
    format!(
        "rgba({:.0},{:.0},{:.0},{})",
        c.r * 255.0,
        c.g * 255.0,
        c.b * 255.0,
        c.a
    )
}

const CSS: &str = r#"
[data-op-refresh-toolbar] { position: fixed; z-index: 2; }
[data-op-refresh-canvas] { all: unset; box-sizing: border-box; width: 100%; height: 100%; display: grid; place-items: center; color: var(--op-fg); border-radius: var(--op-radius); cursor: pointer; }
[data-op-refresh-canvas] svg { width: var(--op-icon); height: var(--op-icon); pointer-events: none; }
[data-op-refresh-canvas]:hover, [data-op-refresh-canvas]:active { background: var(--op-hover); }
[data-op-refresh-canvas]:focus-visible { outline: 2px solid var(--op-ring); outline-offset: -2px; }
[data-op-refresh-canvas][aria-disabled="true"] { cursor: wait; opacity: .72; }
[data-op-refresh-canvas][aria-disabled="true"] svg { animation: op-refresh-spin 800ms linear infinite; }
@keyframes op-refresh-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { [data-op-refresh-canvas][aria-disabled="true"] svg { animation: none; } }
[data-op-refresh-tip] { visibility: hidden; position: absolute; right: 0; top: calc(100% + 5px); pointer-events: none; white-space: nowrap; padding: 5px 8px; border-radius: var(--op-radius); border: 1px solid var(--op-tip-border); color: var(--op-tip-fg); background: var(--op-tip-bg); font: 12px/1.35 system-ui, sans-serif; }
[data-op-refresh-canvas]:is(:hover, :focus-visible, [data-state]:not([data-state="idle"])) + [data-op-refresh-tip] { visibility: visible; }
[data-op-refresh-announcement] { position: absolute; width: 1px; height: 1px; clip-path: inset(50%); overflow: hidden; }
"#;
