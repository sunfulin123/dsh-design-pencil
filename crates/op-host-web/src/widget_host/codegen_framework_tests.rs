use super::{CodeSelectionDragState, WidgetHost};
use op_editor_core::codegen::{CodeSelection, CodegenPhase, Framework};
use op_editor_ui::widgets::property_panel_action::CodegenAction;
use op_editor_ui::widgets::PropertyPanelAction;

#[test]
fn framework_switch_regenerates_deterministic_output_and_drops_stale_state() {
    // fb91df6f: the Code panel generates deterministically on every format
    // switch, so a stale error/degraded result is never restored.
    let mut host = WidgetHost::new();
    {
        let cg = &mut host.editor_state_mut().codegen;
        cg.framework = Framework::Html;
        cg.phase = CodegenPhase::Error;
        cg.code = "<!doctype html><main>Hello</main>".into();
        cg.code_scroll.offset = 48.0;
        cg.code_selection = Some(CodeSelection {
            anchor: 0,
            focus: 6,
        });
        cg.degraded = true;
        cg.selection_snapshot = vec!["hero".into()];
        cg.error = Some("assembly failed".into());
    }
    host.code_selection_drag = Some(CodeSelectionDragState { anchor: 0 });

    for framework in [Framework::Vue, Framework::Html] {
        host.apply_property_action(PropertyPanelAction::Codegen(
            CodegenAction::SelectFramework(framework),
        ));
        let cg = &host.editor_state().codegen;
        assert_eq!(cg.framework, framework);
        assert_eq!(cg.phase, CodegenPhase::Complete);
        assert_ne!(cg.code, "<!doctype html><main>Hello</main>");
        assert_eq!(cg.code_scroll.offset, 0.0);
        assert!(cg.code_selection.is_none());
        assert!(!cg.degraded);
        assert!(cg.error.is_none());
        assert!(host.code_selection_drag.is_none());
    }
}
