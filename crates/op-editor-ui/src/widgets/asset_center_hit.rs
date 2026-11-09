use super::asset_center_panel::{
    tab_hover_token, AssetCenterHit, AssetCenterPanel, ASSET_CENTER_CLOSE_HOVER,
    ASSET_CENTER_GENERATE_HOVER, GENERATE_INPUT_PAD_X, GENERATE_TEXT_SIZE, SEARCH_PAD_X,
    SEARCH_TEXT_SIZE,
};
use super::asset_center_style_geometry::ASSET_CENTER_IMPORT_HOVER;
use super::asset_center_style_import::{
    STYLE_IMPORT_CANCEL_HOVER, STYLE_IMPORT_CONFIRM_HOVER, STYLE_IMPORT_PICK_HOVER,
};
use crate::{Point2D, Rect};

impl AssetCenterPanel<'_> {
    /// Resolve a pointer to a hover token shared with paint.
    pub fn hover_at(&self, panel: Rect, point: Point2D) -> Option<usize> {
        if !panel.contains(point) {
            return None;
        }
        // The paste box covers the gallery: only its own controls light up.
        if self.style_import_open() {
            if self.style_import_confirm_rect(panel).contains(point) {
                return Some(STYLE_IMPORT_CONFIRM_HOVER);
            }
            if self.style_import_cancel_rect(panel).contains(point) {
                return Some(STYLE_IMPORT_CANCEL_HOVER);
            }
            if self
                .style_import_pick_rect(panel)
                .is_some_and(|rect| rect.contains(point))
            {
                return Some(STYLE_IMPORT_PICK_HOVER);
            }
            return None;
        }
        if self.close_rect_for(panel).contains(point) {
            return Some(ASSET_CENTER_CLOSE_HOVER);
        }
        if self
            .style_import_button_rect(panel)
            .is_some_and(|rect| rect.contains(point))
        {
            return Some(ASSET_CENTER_IMPORT_HOVER);
        }
        if let Some((index, _)) = self.tab_at(panel, point) {
            return Some(tab_hover_token(index));
        }
        if self
            .generate_button_rect(panel)
            .is_some_and(|rect| rect.contains(point))
        {
            return Some(ASSET_CENTER_GENERATE_HOVER);
        }
        // A card scrolled out of the viewport must not hover: its rect is
        // still computed (paint clips it), so the viewport check is what
        // keeps a pointer below the panel from lighting up a hidden row.
        let viewport = self.cards_viewport(panel);
        if !viewport.contains(point) {
            return None;
        }
        {
            let cards = self.style_cards();
            let (index, card) = self
                .style_layout_for(panel, &cards)
                .cards
                .into_iter()
                .find(|(_, rect)| rect.contains(point))?;
            return Some(self.style_card_hover_token(index, card, cards[index].is_user, point));
        }
    }

    /// Hit-test panel chrome and cards. Outside presses return `None` so the
    /// caller can treat them as dismiss.
    pub fn hit_test(&self, panel: Rect, point: Point2D) -> Option<AssetCenterHit> {
        if !panel.contains(point) {
            return None;
        }
        // Topmost layer first: while the paste box is up it owns every press
        // inside the panel, including the ones that land on chrome it covers.
        if let Some(hit) = self.style_import_hit(panel, point) {
            return Some(hit);
        }
        if self.close_rect_for(panel).contains(point) {
            return Some(AssetCenterHit::Close);
        }
        if self
            .style_import_button_rect(panel)
            .is_some_and(|rect| rect.contains(point))
        {
            return Some(AssetCenterHit::ImportStyleGuide);
        }
        if let Some((_, tab)) = self.tab_at(panel, point) {
            return Some(AssetCenterHit::SelectTab(tab));
        }
        let search = self.search_rect_for(panel);
        if search.contains(point) {
            let caret = self.caret_at(
                &self.state.editor_ui.asset_center.search,
                search,
                SEARCH_PAD_X,
                SEARCH_TEXT_SIZE,
                point,
            );
            return Some(AssetCenterHit::FocusSearch(caret));
        }
        // Above the topic field: the chip sits in the same row and its
        // dismiss target must not read as a click into the text.
        if let Some(input) = self.generate_input_rect(panel) {
            if input.contains(point) {
                let caret = self.caret_at(
                    &self.state.editor_ui.asset_center.generate,
                    input,
                    GENERATE_INPUT_PAD_X,
                    GENERATE_TEXT_SIZE,
                    point,
                );
                return Some(AssetCenterHit::FocusGenerate(caret));
            }
        }
        if self
            .generate_button_rect(panel)
            .is_some_and(|rect| rect.contains(point))
        {
            return Some(AssetCenterHit::Generate);
        }
        let viewport = self.cards_viewport(panel);
        if viewport.contains(point) {
            {
                let cards = self.style_cards();
                for (index, rect) in self.style_layout_for(panel, &cards).cards {
                    if !rect.contains(point) {
                        continue;
                    }
                    let card = &cards[index];
                    // The ✕ sits on the card, so it has to be tested
                    // before the card itself — otherwise deleting an
                    // import would pin it instead.
                    if card.is_user
                        && self.style_delete_visible(index)
                        && self.style_delete_rect_for(rect).contains(point)
                    {
                        return Some(AssetCenterHit::DeleteStyleGuide(card.id.clone()));
                    }
                    return Some(AssetCenterHit::ToggleStyleGuide(card.id.clone()));
                }
            }
        }
        Some(AssetCenterHit::Inside)
    }
}
