use super::*;
#[test]
fn generated_documents_run_both_repair_tiers() {
    let state = EditorState::new();
    let policy = RepairTierPolicy::for_document(&state);
    assert!(policy.runs(RepairTier::Contract));
    assert!(policy.runs(RepairTier::Intent));
    assert!(policy.intent_skip_note().is_none());
}
