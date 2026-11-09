//! Repair pass classification for generated designs.

use op_editor_core::EditorState;

use crate::repair_summary::RepairSummary;

/// The two kinds of authority a repair pass claims. See the module doc for the
/// judging criterion — it is stated once, here, and nowhere else.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RepairTier {
    /// Repairs a provable defect. Always runs.
    Contract,
    Intent,
}

/// Every pass whose tier has been classified, with the classification itself
/// as the documentation.
///
/// This enum is the annotation the lead asked for: a pass appears here because
/// somebody decided which side of the criterion above it falls on, and the
/// `tier` arm below is that decision in a form the compiler checks. Adding a
/// gate at a call site means naming the pass here first.
///
/// The Contract entries are not gated by anything — they are listed so this
/// type carries both halves of the split rather than reading as a list of
/// suppressions, and so the criterion has worked examples on both sides.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TieredPass {
    // ── Intent ──────────────────────────────────────────────────────────
    ThemeVariablePolarity,
    /// `spacing_repair::strip_wrapper_double_inset` — drops a transparent
    /// wrapper's padding when its parent already pads. An authored board's
    /// 40–80px inset reads as exactly that pattern.
    WrapperDoubleInset,
    StructuralWrapperTransparency,
    /// `role_post_pass::enforce_surface_color_discipline` — recolours a
    /// surface that repeats its parent's token or misuses a state colour.
    /// A deliberate tonal band is indistinguishable from that.
    SurfaceColorDiscipline,
    VariableBinding,
    /// `tree_heuristics::apply_tree_heuristics` — post-streaming fill /
    /// decoration heuristics (redundant section fill strip, nested-card
    /// decoration strip, invisible-band fill).
    TreeHeuristics,

    // ── Contract ────────────────────────────────────────────────────────
    /// `geometry_validation::geometry_validate_and_fix` — runs the real layout
    /// engine and repairs what the resolved rects prove wrong.
    GeometryValidation,
    /// `text_collision` — two text rects overlapping is never a composition.
    TextCollision,
    /// `text_contrast_repair::repair_text_contrast` — text at ~1:1 against its
    /// own background is not styled, it is missing.
    TextContrast,
    /// `role_layout_post_pass::fix_horizontal_overflow` — a row wider than the
    /// viewport it sits in.
    HorizontalOverflow,
}

impl TieredPass {
    /// Which authority this pass claims. The single classification table.
    pub fn tier(self) -> RepairTier {
        match self {
            TieredPass::ThemeVariablePolarity
            | TieredPass::WrapperDoubleInset
            | TieredPass::StructuralWrapperTransparency
            | TieredPass::SurfaceColorDiscipline
            | TieredPass::VariableBinding
            | TieredPass::TreeHeuristics => RepairTier::Intent,
            TieredPass::GeometryValidation
            | TieredPass::TextCollision
            | TieredPass::TextContrast
            | TieredPass::HorizontalOverflow => RepairTier::Contract,
        }
    }
}

/// Which tiers may run for one document, and why not, when a tier may not.
///
/// Resolved from [`EditorState`] rather than passed in, so the orchestrator
/// path (`DocSink::state()`) and the agentic-loop path (the live state) reach
/// the same answer without either needing a new parameter — and so neither can
/// be wired up while the other silently is not.
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct RepairTierPolicy;

impl RepairTierPolicy {
    pub fn all() -> Self {
        Self
    }

    /// The policy for `state`.
    pub fn for_document(_state: &EditorState) -> Self {
        Self
    }

    /// Whether `tier` may run under this policy.
    pub fn runs(&self, _tier: RepairTier) -> bool {
        true
    }

    /// Whether `pass` may run — the form call sites use, so the tier lookup
    /// and the gate cannot drift apart.
    pub fn runs_pass(&self, pass: TieredPass) -> bool {
        self.runs(pass.tier())
    }

    pub fn intent_skip_note(&self) -> Option<String> {
        None
    }
}

/// Record the skip in `summary` and the log, so "did not run" reads as a
/// decision rather than as a gap. No-op when the intent tier ran.
///
/// Called once per cleanup run, from the first gated site in the driver
/// (`cleanup_root_transform::intent_theme_variable_polarity`), which is reached
/// on every path through it.
pub(crate) fn note_intent_tier_skip(summary: &mut RepairSummary, policy: &RepairTierPolicy) {
    let Some(note) = policy.intent_skip_note() else {
        return;
    };
    summary.note(note);
}

#[cfg(test)]
#[path = "repair_tier_tests.rs"]
mod tests;
