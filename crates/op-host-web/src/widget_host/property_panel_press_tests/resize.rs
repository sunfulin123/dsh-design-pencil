use super::*;

#[test]
fn layout_buttons_keep_their_selection_after_release_and_desktop_resize() {
    let mut host = WidgetHost::new();
    seed(
        &mut host,
        r##"{ "version": "1.0.0", "children": [
              {"type":"rectangle","id":"n62","name":"Wide",
               "x":40,"y":40,"width":180,"height":120,
               "fill":[{"type":"solid","color":"#BDC7D9"}]}
        ]}"##,
    );
    host.editor_state.set_single_selection(NodeId::new("n62"));

    for width in [1440.0, 744.0, 390.0, 320.0, 1024.0] {
        host.sync_responsive_viewport(width, VIEWPORT_H);
        let rect = op_editor_ui::widgets::host_canvas_geometry::property_panel_rect(
            &host.editor_state,
            width,
            VIEWPORT_H,
        );
        assert_eq!(rect.origin.x, width - rect.size.x);
        assert_eq!(rect.origin.y, TOP_BAR_HEIGHT);

        for mode in [
            FlexLayout::Vertical,
            FlexLayout::Horizontal,
            FlexLayout::Free,
        ] {
            let mut point = point_for_action(
                &host,
                |action| matches!(action, PropertyPanelAction::SetFlexLayout(value) if *value == mode),
            );
            point.x += width - VIEWPORT_W;
            let panel = PropertyPanel::for_selection(&host.editor_state).expect("property panel");
            assert_eq!(
                panel.hit_test_action(rect, point),
                Some(PropertyPanelAction::SetFlexLayout(mode))
            );
            assert!(host.apply_press(point.x, point.y, width, VIEWPORT_H));
            assert!(host.apply_release_with_viewport(width, VIEWPORT_H));
            assert_eq!(host.editor_state.selection.anchor, NodeId::new("n62"));
            assert_eq!(host.editor_state.editor_ui.pressed_button, None);
            assert_eq!(
                PropertyPanel::for_selection(&host.editor_state)
                    .expect("property panel after release")
                    .flex_layout,
                mode
            );
        }
    }
}
