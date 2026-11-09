use op_editor_core::AssetCenterFocus;

use super::asset_center_panel::{
    tab_hover_token, AssetCenterPanel, ASSET_CENTER_CLOSE_HOVER, ASSET_CENTER_GENERATE_HOVER,
    CONTROL_RADIUS, GENERATE_HINT_SIZE, GENERATE_INPUT_PAD_X, GENERATE_TEXT_SIZE, SEARCH_PAD_X,
    SEARCH_TEXT_SIZE, TITLE_SIZE,
};
use super::panel_controls::{
    paint_accent_button, paint_segmented_control, ButtonSpec, SegmentState,
};
use crate::widgets::prompt_center_panel::estimated_text_width;
use crate::widgets::property_panel_text_input::paint_text_input_view;
use crate::widgets::{draw_icon, Icon, PaintCx};
use crate::{Color, Point2D, Rect, TextLayout};

/// Corner radius of the gallery frame itself. Larger than a dropdown's
/// because the shape is read at canvas scale, not at menu scale.
const PANEL_RADIUS: f32 = 16.0;

/// Section-heading text size — the same size the Styles tab uses, so the two
/// tabs' "mine / built-in" bands read as one visual language.

impl AssetCenterPanel<'_> {
    /// Paint the complete gallery.
    pub fn paint(&self, cx: &mut PaintCx<'_>, panel: Rect) {
        cx.backend
            .fill_round_rect(panel, PANEL_RADIUS, self.theme.popover);
        cx.backend
            .stroke_round_rect(panel, PANEL_RADIUS, self.theme.border, 1.0);
        self.paint_header(cx, panel);
        self.paint_tab_chips(cx, panel);
        self.paint_search(cx, panel);
        self.paint_generate_row(cx, panel);
        self.paint_style_cards(cx, panel);
        // Last, over everything: the paste box is the panel's topmost layer,
        // matching the press ladder that gives it every click inside the panel.
        self.paint_style_import(cx, panel);
    }

    /// The tab row: a segmented control, not two pills.
    ///
    /// Which asset family the panel is showing is a mode, and a mode with
    /// exactly one answer is what a segmented control is for. Two separate
    /// pills said neither thing — they read as filters that happened to be
    /// mutually exclusive by luck.
    fn paint_tab_chips(&self, cx: &mut PaintCx<'_>, panel: Rect) {
        let tabs = op_editor_core::AssetCenterTab::ALL;
        let labels: Vec<&str> = tabs.into_iter().map(|tab| self.tab_label(tab)).collect();
        let states: Vec<SegmentState> = tabs
            .into_iter()
            .enumerate()
            .map(|(index, tab)| SegmentState {
                selected: self.tab() == tab,
                hovered: self.state.editor_ui.asset_center.hover == Some(tab_hover_token(index)),
                pressed: self.is_pressed(tab_hover_token(index)),
            })
            .collect();
        paint_segmented_control(
            cx,
            &self.theme,
            self.tab_track_rect(panel),
            &labels,
            &states,
        );
    }

    fn paint_header(&self, cx: &mut PaintCx<'_>, panel: Rect) {
        let content = Self::content_rect(panel);
        self.paint_text(
            cx,
            self.t("assetCenter.title", "资产中心"),
            Point2D::new(
                content.origin.x,
                jian_widgets::centered_text_baseline_y(
                    Rect::xywh(
                        content.origin.x,
                        panel.origin.y,
                        content.size.x,
                        self.header_height_for(panel),
                    ),
                    TITLE_SIZE,
                ),
            ),
            TITLE_SIZE,
            self.theme.foreground,
        );

        let close = self.close_rect_for(panel);
        jian_widgets::components::icon_button::IconButton {
            icon_paths: Icon::Close.paths(),
            hovered: self.state.editor_ui.asset_center.hover == Some(ASSET_CENTER_CLOSE_HOVER),
            pressed: self.is_pressed(ASSET_CENTER_CLOSE_HOVER),
            active: false,
            enabled: true,
            icon_size: close.size.x - 14.0,
            stroke_width: 1.5,
        }
        .paint(
            cx.backend,
            close,
            &crate::widgets::button::tokens_from_theme(&self.theme),
        );

        cx.backend.fill_rect(
            Rect::xywh(
                panel.origin.x,
                panel.origin.y + self.header_height_for(panel),
                panel.size.x,
                1.0,
            ),
            self.theme.border,
        );
    }

    fn paint_search(&self, cx: &mut PaintCx<'_>, panel: Rect) {
        let rect = self.search_rect_for(panel);
        self.paint_field_frame(cx, rect, Icon::Search);
        paint_text_input_view(
            cx,
            &self.theme,
            &self.state.editor_ui.asset_center.search,
            rect,
            SEARCH_TEXT_SIZE,
            SEARCH_PAD_X,
            jian_widgets::centered_text_baseline_y(rect, SEARCH_TEXT_SIZE),
            self.now_ms(),
            self.t("assetCenter.style.searchPlaceholder", "搜索风格或标签"),
            self.field_focused(AssetCenterFocus::Search),
        );
    }

    /// The box and leading glyph every text field in this panel is drawn in.
    ///
    /// One helper rather than two copies, because the search field and the
    /// topic field are the same control with a different placeholder — and
    /// two copies is how they ended up with the glyph at a hard-coded
    /// `y + 11` that only centred at one field height.
    fn paint_field_frame(&self, cx: &mut PaintCx<'_>, rect: Rect, icon: Icon) {
        cx.backend
            .fill_round_rect(rect, CONTROL_RADIUS, self.theme.muted);
        cx.backend
            .stroke_round_rect(rect, CONTROL_RADIUS, self.theme.input, 1.0);
        const GLYPH: f32 = 16.0;
        draw_icon(
            cx.backend,
            icon,
            Point2D::new(
                rect.origin.x + (SEARCH_PAD_X - GLYPH) / 2.0,
                rect.origin.y + (rect.size.y - GLYPH) / 2.0,
            ),
            GLYPH,
            self.theme.muted_foreground,
            1.4,
        );
    }

    /// The prompt-to-deck row: a topic field, a generate button, and one line
    /// saying what pressing it does. The sentence is not decoration — the row
    /// replaces the document, and a control that quietly discards the canvas
    /// has to say so before it is pressed, not after.
    fn paint_generate_row(&self, cx: &mut PaintCx<'_>, panel: Rect) {
        let Some(input) = self.generate_input_rect(panel) else {
            return;
        };
        let button = self
            .generate_button_rect(panel)
            .expect("the button rect exists whenever the input does");

        self.paint_field_frame(cx, input, Icon::Sparkles);
        paint_text_input_view(
            cx,
            &self.theme,
            &self.state.editor_ui.asset_center.generate,
            input,
            GENERATE_TEXT_SIZE,
            GENERATE_INPUT_PAD_X,
            jian_widgets::centered_text_baseline_y(input, GENERATE_TEXT_SIZE),
            self.now_ms(),
            self.t(
                "assetCenter.generate.placeholder",
                "描述主题，AI 直接生成整副演示文稿",
            ),
            self.field_focused(AssetCenterFocus::Generate),
        );

        // Same radius as the field it sits beside, and the same pointer
        // ladder the tab selection rides — a flat blue slab that never
        // changed under the cursor was the one control in the row that did
        // not answer being pointed at.
        paint_accent_button(
            cx,
            &self.theme,
            ButtonSpec {
                rect: button,
                radius: CONTROL_RADIUS,
                label: self.t("assetCenter.generate.button", "生成"),
                label_size: GENERATE_TEXT_SIZE,
                hovered: self.state.editor_ui.asset_center.hover
                    == Some(ASSET_CENTER_GENERATE_HOVER),
                pressed: self.is_pressed(ASSET_CENTER_GENERATE_HOVER),
            },
        );

        self.paint_text(
            cx,
            // The deck-specific wording belongs to the Templates tab, where
            // the row is gated to the slides scene. On the Styles tab the row
            // means "generate anything, in this aesthetic".
            self.t("assetCenter.style.searchPlaceholder", "搜索风格或标签"),
            Point2D::new(input.origin.x + 2.0, input.origin.y + input.size.y + 18.0),
            GENERATE_HINT_SIZE,
            self.theme.muted_foreground,
        );
    }

    pub(super) fn t(&self, key: &'static str, fallback: &'static str) -> &'static str {
        let translated = op_i18n::translate(self.locale, key);
        if translated == key {
            fallback
        } else {
            translated
        }
    }

    pub(super) fn paint_text(
        &self,
        cx: &mut PaintCx<'_>,
        text: &str,
        position: Point2D,
        size: f32,
        color: Color,
    ) {
        let layout = TextLayout::single_run(
            text,
            "system-ui",
            size,
            color.to_jian(),
            Point2D::new(0.0, 0.0),
        );
        cx.backend.draw_text(&layout, position);
    }
}

pub(super) fn truncate_to_width(text: &str, max_width: f32, size: f32) -> String {
    if estimated_text_width(text, size) <= max_width {
        return text.to_string();
    }
    let ellipsis_w = estimated_text_width("…", size);
    let mut out = String::new();
    let mut width = 0.0;
    for character in text.chars() {
        let advance = estimated_text_width(&character.to_string(), size);
        if width + advance + ellipsis_w > max_width {
            break;
        }
        out.push(character);
        width += advance;
    }
    out.push('…');
    out
}
