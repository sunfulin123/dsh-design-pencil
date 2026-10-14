use super::top_bar::*;
use crate::{Point2D, Rect};

#[test]
fn vscode_embed_keeps_file_controls_and_hides_fullscreen() {
    let mut bar = TopBar::new("Untitled").with_traffic_controls(false);
    bar.embed = op_editor_core::EmbedHost::VsCode;
    let rect = Rect {
        origin: Point2D::new(0.0, 0.0),
        size: Point2D::new(1200.0, TOP_BAR_HEIGHT),
    };
    for x in 0..1200 {
        let hit = bar.hit_test(rect, Point2D::new(x as f32, TOP_BAR_HEIGHT / 2.0));
        assert!(
            !matches!(hit, Some(TopBarHit::ToggleFullscreen)),
            "hidden control hit at x={x}: {hit:?}"
        );
    }
    let hits: Vec<_> = (0..1200)
        .filter_map(|position| {
            bar.hit_test(rect, Point2D::new(position as f32, TOP_BAR_HEIGHT / 2.0))
        })
        .collect();
    assert!(hits.contains(&TopBarHit::ToggleFileMenu));
    assert!(hits.contains(&TopBarHit::OpenImportMenu));
}

#[test]
fn vscode_embed_keeps_preview_account_collaboration_and_shared_chrome() {
    let mut bar = TopBar::new("Untitled").with_traffic_controls(false);
    bar.embed = op_editor_core::EmbedHost::VsCode;
    bar.account_button_visible = true;
    bar.collab.visible = true;
    bar.collab.enabled = true;
    bar.collab.label = "Collaborate".to_string();
    let rect = Rect {
        origin: Point2D::new(0.0, 0.0),
        size: Point2D::new(1200.0, TOP_BAR_HEIGHT),
    };
    let hits: Vec<_> = (0..1200)
        .filter_map(|x| bar.hit_test(rect, Point2D::new(x as f32, TOP_BAR_HEIGHT / 2.0)))
        .collect();
    for expect in [
        TopBarHit::ToggleSidebar,
        TopBarHit::ToggleLocale,
        TopBarHit::ToggleTheme,
        TopBarHit::OpenAgentSettings,
        TopBarHit::TogglePreview,
        TopBarHit::Account,
        TopBarHit::Collaboration,
    ] {
        assert!(hits.contains(&expect), "missing {expect:?}");
    }
}

#[test]
fn host_locale_override_hides_locale_picker_button() {
    let mut ui = op_editor_core::EditorUiState::default();
    ui.set_host_locale_override(Some(op_editor_core::Locale::ZhCn));
    let bar = TopBar::for_editor_ui(&ui);
    assert!(!bar.locale_button_visible());
    let rect = Rect {
        origin: Point2D::new(0.0, 0.0),
        size: Point2D::new(1200.0, TOP_BAR_HEIGHT),
    };
    for x in 0..1200 {
        let hit = bar.hit_test(rect, Point2D::new(x as f32, TOP_BAR_HEIGHT / 2.0));
        assert!(
            !matches!(hit, Some(TopBarHit::ToggleLocale)),
            "hidden locale button hit at x={x}: {hit:?}"
        );
    }
}

#[test]
fn managed_embed_hides_host_controls_and_keeps_document_tools() {
    let mut ui = op_editor_core::EditorUiState {
        embed: op_editor_core::EmbedHost::VsCode,
        ..Default::default()
    };
    ui.account_ui_available = true;
    let mut bar = TopBar::for_editor_ui(&ui).with_traffic_controls(false);
    bar.collab.visible = true;
    bar.collab.enabled = true;
    bar.collab.label = "Collaborate".to_string();
    for width in [600, 1200] {
        let rect = Rect::xywh(0.0, 0.0, width as f32, TOP_BAR_HEIGHT);
        let hits: Vec<_> = (0..width)
            .filter_map(|position| {
                bar.hit_test(rect, Point2D::new(position as f32, TOP_BAR_HEIGHT / 2.0))
            })
            .collect();
        for hidden in [
            TopBarHit::ToggleFileMenu,
            TopBarHit::ToggleGitPanel,
            TopBarHit::OpenAgentSettings,
            TopBarHit::Collaboration,
            TopBarHit::Account,
            TopBarHit::ToggleTheme,
            TopBarHit::ToggleLocale,
        ] {
            assert!(
                !hits.contains(&hidden),
                "hidden control {hidden:?} at width={width}"
            );
        }
        for retained in [
            TopBarHit::ToggleSidebar,
            TopBarHit::OpenImportMenu,
            TopBarHit::OpenAssetCenter,
            TopBarHit::OpenExportMenu,
            TopBarHit::TogglePreview,
        ] {
            assert!(
                hits.contains(&retained),
                "missing {retained:?} at width={width}"
            );
        }
    }
}
