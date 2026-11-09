//! Shared argv dispatcher for the headless CLI server modes.
//!
//! Both binaries expose the same three modes — `--mcp <path>` (JSON-RPC
//! stdio MCP server), `--mcp-http <port> <path>` (Streamable-HTTP MCP
//! server), and `--serve-web <port> [doc] [--host <addr>]` (headless
//! web-canvas daemon) — differing only in the program name their
//! diagnostics carry. `op-host-desktop` falls back to the GUI on an
//! unknown mode; `op-host-web-server` treats it as a usage error. Both
//! decisions stay with the caller.

use std::path::PathBuf;

/// Run the headless server mode named by `mode` (the first argv token),
/// consuming the remaining `args`.
///
/// - `None` — `mode` is not one of the three server modes; the caller
///   decides what an unknown mode means.
/// - `Some(0)` — the mode ran to completion.
/// - `Some(code)` — the mode failed; the diagnostic (prefixed with
///   `"{prog} {mode}: "`) has already been printed to stderr and the
///   caller should exit with `code` (2 = malformed invocation, 1 =
///   runtime failure).
pub fn run_cli_mode(prog: &str, mode: &str, mut args: impl Iterator<Item = String>) -> Option<i32> {

}
