//! Render-only mode (`?renderer=headless`): a hidden browser that answers MCP
//! screenshot requests for the Node host. It mirrors the daemon document but
//! must never write back — no document, camera or selection pushes.

use std::cell::Cell;

thread_local! {
    static RENDER_ONLY: Cell<bool> = const { Cell::new(false) };
}

pub(crate) fn set_render_only(enabled: bool) {
    RENDER_ONLY.with(|flag| flag.set(enabled));
}

pub(crate) fn render_only() -> bool {
    RENDER_ONLY.with(Cell::get)
}

/// Whether the query string asks for render-only mode.
pub(crate) fn render_only_requested(search: &str) -> bool {
    search
        .trim_start_matches('?')
        .split('&')
        .any(|pair| pair == "renderer=headless")
}

/// Render-queue client tag the Node host uses to route requests.
pub(crate) fn render_client() -> &'static str {
    if render_only() {
        "headless"
    } else {
        "editor"
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn query_selects_render_only_and_client_tag() {
        assert!(render_only_requested("?renderer=headless"));
        assert!(render_only_requested("?perf=1&renderer=headless"));
        assert!(!render_only_requested("?renderer=headlessx"));
        assert!(!render_only_requested(""));
        set_render_only(true);
        assert_eq!(render_client(), "headless");
        set_render_only(false);
        assert_eq!(render_client(), "editor");
    }
}
