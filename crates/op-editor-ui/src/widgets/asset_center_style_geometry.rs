use op_editor_core::AssetCenterTab;

use super::asset_center_panel::{AssetCenterPanel, CHIP_LABEL_SIZE};
use super::asset_center_style_cards::{user_card_count, StyleGuideCard};
use super::asset_center_style_layout::{style_grid_layout, StyleGridLayout, StyleGridMetrics};
use super::prompt_center_panel::estimated_text_width;
use crate::{Point2D, Rect};

/// Hover token for the import button.
pub(super) const ASSET_CENTER_IMPORT_HOVER: usize = usize::MAX - 128;

/// Base of the per-card delete-button hover band.
///
/// Its own band, well clear of the card-index band below it: a delete button
/// and the card it sits on are different targets, and sharing a token would
/// make hovering the ✕ light the whole card as if it were about to be pinned.
const STYLE_DELETE_HOVER_BASE: usize = usize::MAX - 4096;

/// Side of the square delete button on an imported card.
pub(super) const STYLE_DELETE_BTN: f32 = 22.0;

impl AssetCenterPanel<'_> {
    /// A hover token for the delete button of the card at `index`.
    pub(super) fn style_delete_hover_token(index: usize) -> usize {
        STYLE_DELETE_HOVER_BASE + index
    }

    pub fn style_import_button_rect(&self, panel: Rect) -> Option<Rect> {
        if self.tab() != AssetCenterTab::Styles {
            return None;
        }
        // The control column, not the full content width: on a wide display
        // the grid runs to the panel edge, and an action pinned out there
        // would sit a screen's width from the tab row it belongs to.
        let content = Self::control_rect(panel);
        let width = estimated_text_width(self.style_import_label(), CHIP_LABEL_SIZE) + 34.0;
        Some(Rect::xywh(
            content.origin.x + content.size.x - width,
            panel.origin.y
                + self.header_height_for(panel)
                + (self.tab_row_height_for(panel) - self.density().chip_h) / 2.0,
            width,
            self.density().chip_h,
        ))
    }

    pub(super) fn style_import_label(&self) -> &'static str {
        self.t("assetCenter.style.import", "导入风格")
    }

    /// The delete button on an imported card, in its top-right corner.
    pub(super) fn style_delete_rect(card: Rect) -> Rect {
        Rect::xywh(
            card.origin.x + card.size.x - STYLE_DELETE_BTN - 8.0,
            card.origin.y + 8.0,
            STYLE_DELETE_BTN,
            STYLE_DELETE_BTN,
        )
    }

    /// Whether the card at `index` shows its delete button right now.
    ///
    /// Hover-gated: a permanent ✕ on every imported card turns the section
    /// into a list of things to remove. It stays live while the pointer is on
    /// the button itself as well as on the card, or moving toward it would
    /// make it vanish.
    pub(super) fn style_delete_visible(&self, index: usize) -> bool {
        if self.touch_density_active() {
            return true;
        }
        let hover = self.state.editor_ui.asset_center.hover;
        hover == Some(index) || hover == Some(Self::style_delete_hover_token(index))
    }

    pub(super) fn style_layout_for(
        &self,
        panel: Rect,
        cards: &[StyleGuideCard],
    ) -> StyleGridLayout {
        let viewport = self.cards_viewport(panel);
        let (columns, card_w, card_h) = self.grid_metrics(panel);
        let metrics = StyleGridMetrics {
            columns,
            card_w,
            card_h,
            card_gap: super::asset_center_panel::CARD_GAP,
            user_count: user_card_count(cards),
            total: cards.len(),
        };
        // Height first, unscrolled, so the offset can be clamped against a
        // limit that already counts the headings.
        let height = style_grid_layout(viewport, &metrics, 0.0).content_height;
        let scroll = self
            .state
            .editor_ui
            .asset_center
            .scroll
            .offset
            .clamp(0.0, (height - viewport.size.y).max(0.0));
        style_grid_layout(viewport, &metrics, scroll)
    }

    /// The Styles grid for whatever the search box currently matches.
    pub(super) fn style_layout(&self, panel: Rect) -> StyleGridLayout {
        self.style_layout_for(panel, &self.style_cards())
    }

    /// Resolve a pointer over the Styles grid to a hover token, so paint and
    /// hover agree about which of a card's two targets is lit.
    pub(super) fn style_card_hover_token(
        &self,
        index: usize,
        card: Rect,
        is_user: bool,
        point: Point2D,
    ) -> usize {
        if is_user && self.style_delete_rect_for(card).contains(point) {
            return Self::style_delete_hover_token(index);
        }
        index
    }
}
