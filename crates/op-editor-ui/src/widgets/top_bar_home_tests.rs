//! Home (制图台) button geometry + hit-test on the editor TopBar.

use super::top_bar::*;
use crate::{Point2D, Rect};

fn top_bar_rect() -> Rect {
    Rect {
        origin: Point2D::new(0.0, 0.0),
        size: Point2D::new(1200.0, TOP_BAR_HEIGHT),
    }
}

#[test]
fn home_button_sits_right_of_file_menu_and_hit_tests() {
    let bar = TopBar::new("Untitled");
    let rect = top_bar_rect();
    let file_menu = bar.file_menu_rect_for(rect);
    let home = bar.home_button_rect(rect);
    let divider_span = DIVIDER_GAP + DIVIDER_W + DIVIDER_GAP;

    assert_eq!(home.size.x, ICON_BUTTON);
    assert_eq!(home.size.y, ICON_BUTTON);
    assert_eq!(home.origin.y, file_menu.origin.y);
    assert_eq!(
        home.origin.x,
        file_menu.origin.x + FILE_MENU_BUTTON_WIDTH + divider_span
    );
    assert!(
        home.origin.x >= file_menu.origin.x + file_menu.size.x,
        "home {home:?} overlaps file_menu {file_menu:?}"
    );

    let center = Point2D::new(
        home.origin.x + home.size.x / 2.0,
        home.origin.y + home.size.y / 2.0,
    );
    assert_eq!(bar.hit_test(rect, center), Some(TopBarHit::Home));
}

#[test]
fn home_button_does_not_move_file_menu_rect() {
    // macOS reserves 66px for native traffic lights; other platforms reserve
    // TRAFFIC_STEP*2 + TRAFFIC_DOT + 16 = 68.
    let expected_file_menu_x = if cfg!(target_os = "macos") {
        115.0
    } else {
        117.0
    };

    let bar = TopBar::new("Untitled");
    let rect = top_bar_rect();
    let file_menu = bar.file_menu_rect_for(rect);
    let import = bar.import_button_rect(rect);

    assert_eq!(file_menu.origin.x, expected_file_menu_x);
    assert_eq!(file_menu.origin.y, 8.0);
    assert_eq!(file_menu.size.x, FILE_MENU_BUTTON_WIDTH);
    assert_eq!(file_menu.size.y, ICON_BUTTON);
    assert_eq!(import.size.x, 0.0);
    assert_eq!(import.size.y, 0.0);
}
