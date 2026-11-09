use op_editor_core::{AssetCenterFocus, AssetCenterTab, ButtonPressTarget, EditorState, Locale};

use super::asset_center_style_cards::{cards_for_editor, StyleGuideCard};
use super::panel_controls::{segment_rects, segment_track_width, segment_width_for};
use super::prompt_center_panel::estimated_text_width;
use crate::theme::Theme;
use crate::widgets::editor_state_ext::theme_for;
use crate::{Color, Point2D, Rect};

/// Margin between the canvas region and the gallery on every side.
///
/// The Asset Center is a full-canvas gallery, not a dialog: it has no
/// intrinsic size, only this inset. The margin exists so the rounded frame
/// and its scrim still read as a layer above the editor rather than as a new
/// window that replaced it.
pub const ASSET_CENTER_GALLERY_INSET: f32 = 24.0;

/// Widest a single *control* row ever gets, whatever the panel does.
///
/// A search field or a topic input stretched across a 32" display reads as a
/// spreadsheet: it is one thing, and one thing two metres wide is harder to
/// use than the same thing at arm's length. The card grid is the opposite —
/// it is many things, and extra width buys more of them — so it is **not**
/// capped (see [`AssetCenterPanel::content_rect`] against
/// [`AssetCenterPanel::control_rect`]). Both start at the same left edge,
/// so the column reads as one column that the grid simply runs longer than.
///
/// The Prompt Center still uses this as its whole-content cap; that panel is
/// a dialog-sized overlay rather than a full-canvas gallery, and its grid
/// never had the empty right half this split exists to close.
pub const ASSET_CENTER_CONTENT_MAX_W: f32 = 1680.0;

/// Dimming laid over the editor behind the gallery.
///
/// Slightly heavier than the modal scrims (0.45) because the gallery is the
/// only overlay whose own surface is opaque edge to edge — a lighter wash
/// would show only in the thin margin, where it reads as a drop shadow rather
/// than as the editor stepping back.
pub const ASSET_CENTER_SCRIM: Color = Color {
    r: 0.0,
    g: 0.0,
    b: 0.0,
    a: 0.5,
};

/// Hover token for the close button.
pub const ASSET_CENTER_CLOSE_HOVER: usize = usize::MAX;

/// Hover token for the generate button.
pub const ASSET_CENTER_GENERATE_HOVER: usize = usize::MAX - 64;

/// Tab chips reserve their own token band. It sits below the filter band
/// (which reaches `FILTER_HOVER_BASE + scene count`) so the two can never
/// collide as either row grows.
const TAB_HOVER_BASE: usize = usize::MAX - 96;

pub(super) const PAD: f32 = 24.0;
pub(super) const HEADER_H: f32 = 72.0;
pub(super) const TITLE_SIZE: f32 = 24.0;
pub(super) const TAB_ROW_H: f32 = 48.0;
pub(super) const SEARCH_ROW_H: f32 = 52.0;
/// Every control in this panel measures against the shared ladder in
/// `panel_control_metrics` rather than declaring its own box. The four
/// aliases below exist only so the call sites already written against these
/// names keep reading as panel geometry; they are not a second source.
pub(super) use crate::widgets::panel_control_metrics::{
    CHIP_H, CHIP_LABEL_SIZE, CONTROL_H, CONTROL_RADIUS,
};

/// The close button is an icon button, so it is square rather than
/// chip-shaped — but it is a chip's height, because it sits in the same
/// header band as the tab row below it.
pub(super) const CLOSE_BTN: f32 = CHIP_H;
pub(super) const SEARCH_TEXT_SIZE: f32 = 13.0;
/// Left inset of the search text, clearing the magnifier glyph. Shared by
/// paint and the caret hit-test so a click lands where the glyph is drawn.
pub(super) const SEARCH_PAD_X: f32 = 34.0;
pub(super) const CARD_GAP: f32 = 20.0;
pub(super) const GENERATE_ROW_H: f32 = 72.0;
/// The topic field and the generate button are one row, so they are one
/// height — [`CONTROL_H`], the same box the search field above them uses.
pub(super) const GENERATE_BUTTON_W: f32 = 108.0;
pub(super) const GENERATE_GAP: f32 = 10.0;
pub(super) const GENERATE_TEXT_SIZE: f32 = 13.0;
pub(super) const GENERATE_HINT_SIZE: f32 = 11.0;
/// Left inset of the topic text, clearing the sparkle glyph. Shared by paint
/// and the caret hit-test, for the same reason [`SEARCH_PAD_X`] is.
pub(super) const GENERATE_INPUT_PAD_X: f32 = 34.0;
pub(super) const CARD_PREVIEW_INSET: f32 = 10.0;
pub(super) const CARD_PREVIEW_ASPECT: f32 = 16.0 / 10.0;
pub(super) const STYLE_CARD_H: f32 = 108.0;
pub(super) const STYLE_SWATCH_H: f32 = 20.0;

/// Widest a card is allowed to get before the grid adds a column.
///
/// Past roughly this width a 16:10 preview stops gaining legibility and the
/// row starts reading as a banner strip — which is the *only* reason the
/// column count exists. Stating the ceiling instead of a ladder of
/// breakpoints is what lets the grid keep working past the widths anyone
/// wrote breakpoints for: it answered 4 columns on a laptop and 4 columns on
/// a 5K display, leaving half the panel empty.
pub(super) const CARD_MAX_W: f32 = 470.0;

/// Column count for a card viewport of `width`.
///
/// The fewest columns that keep every card at or under [`CARD_MAX_W`], never
/// below two. There is no upper bound: a wider window buys more cards per
/// row, all the way out, so the gallery fills whatever it is given rather
/// than centring a fixed number of columns in an ocean of background.
///
/// Card width lands between roughly 310 px (just past a breakpoint) and
/// [`CARD_MAX_W`] (just before the next one), so the steps read as the grid
/// tightening and then relaxing, not as cards changing size arbitrarily.
pub(super) fn grid_columns(width: f32) -> usize {
    if !width.is_finite() || width <= 0.0 {
        return 2;
    }
    (((width + CARD_GAP) / (CARD_MAX_W + CARD_GAP)).ceil() as usize).max(2)
}

/// Card width for `columns` cards sharing a viewport of `viewport_w`.
pub(super) fn card_width(viewport_w: f32, columns: usize) -> f32 {
    ((viewport_w - CARD_GAP * (columns - 1) as f32) / columns as f32).max(1.0)
}

/// A hover token for the filter chip at `index`.

/// A hover token for the tab chip at `index`.
pub(super) fn tab_hover_token(index: usize) -> usize {
    TAB_HOVER_BASE + index
}

/// What a press inside the panel resolved to.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum AssetCenterHit {
    Close,
    FocusSearch(usize),
    /// Put the caret in the generate row's topic field.
    FocusGenerate(usize),
    /// Submit the typed topic as a generation request.
    Generate,
    /// Switch which asset family the panel is showing.
    SelectTab(AssetCenterTab),
    ToggleStyleGuide(String),
    /// Open the import box. Both ways in — paste and file — live inside it,
    /// on every host.
    ImportStyleGuide,
    /// Ask the host for a `DESIGN.md` file. Only ever raised where the host
    /// declared it can open a dialog.
    PickStyleImportFile,
    /// Forget an imported style guide, by id. Only ever an import: the
    /// shipped corpus is not the user's to delete.
    DeleteStyleGuide(String),
    InsideStyleImport,
    /// Put the caret in the import paste box.
    FocusStyleImport(usize),
    /// Read the pasted text as a style guide.
    ConfirmStyleImport,
    /// Dismiss the paste box, discarding the draft.
    CancelStyleImport,
    /// Inside the panel but not on a control — swallows the press so it
    /// cannot fall through to the canvas underneath.
    Inside,
}

pub struct AssetCenterPanel<'a> {
    pub(super) state: &'a EditorState,
    pub(super) theme: Theme,
    pub(super) locale: Locale,
    pub(super) now_ms: u64,
}

impl<'a> AssetCenterPanel<'a> {
    /// Build the panel when it is open.
    pub fn for_editor(state: &'a EditorState) -> Option<Self> {
        Self::for_editor_at(state, 0)
    }

    /// Build the panel with a frame clock for caret blinking.
    pub fn for_editor_at(state: &'a EditorState, now_ms: u64) -> Option<Self> {
        state.editor_ui.asset_center.open.then(|| Self {
            state,
            theme: theme_for(&state.editor_ui),
            locale: state.editor_ui.effective_locale(),
            now_ms,
        })
    }

    pub(super) fn now_ms(&self) -> u64 {
        self.now_ms
    }

    pub(super) fn is_pressed(&self, token: usize) -> bool {
        matches!(
            self.state.editor_ui.pressed_button,
            Some(ButtonPressTarget::AssetCenter(pressed)) if pressed == token
        )
    }

    /// Which asset family the panel is showing.
    pub fn tab(&self) -> AssetCenterTab {
        self.state.editor_ui.asset_center.tab
    }

    /// The pinned style guide's name, if any.
    pub fn pinned_style_guide(&self) -> Option<&str> {
        self.state.editor_ui.pinned_style_guide.as_deref()
    }

    /// Style guides surviving the search query, in registry order.
    pub fn style_cards(&self) -> Vec<StyleGuideCard> {
        cards_for_editor(self.state, self.state.editor_ui.asset_center.search.text())
    }

    /// The content column every row inside the gallery measures from.
    ///
    /// It is the panel inset by [`PAD`] and nothing else — the grid runs the
    /// full width it is given. That is a deliberate reversal: the column used
    /// to be capped and centred, which on a 5K display painted four cards in
    /// the middle and left the right half of the gallery empty while the
    /// catalogue scrolled underneath.
    ///
    /// Single controls do not want that width and do not get it; they read
    /// off [`Self::control_rect`], which shares this left edge. Every rect
    /// below derives its x from one of the two, so paint and hit-testing move
    /// together by construction.
    pub fn content_rect(panel: Rect) -> Rect {
        Rect::xywh(
            panel.origin.x + PAD,
            panel.origin.y,
            (panel.size.x - PAD * 2.0).max(0.0),
            panel.size.y,
        )
    }

    /// The column a single full-width control occupies.
    ///
    /// Left-aligned with [`Self::content_rect`] and capped at
    /// [`ASSET_CENTER_CONTENT_MAX_W`]: a search field or a topic input is
    /// one control, and one control the width of a wall is harder to use, not
    /// easier. Only the grid, which is many things, takes the whole panel.
    pub fn control_rect(panel: Rect) -> Rect {
        let content = Self::content_rect(panel);
        Rect::xywh(
            content.origin.x,
            content.origin.y,
            content.size.x.min(ASSET_CENTER_CONTENT_MAX_W),
            content.size.y,
        )
    }

    pub fn close_rect(panel: Rect) -> Rect {
        let content = Self::content_rect(panel);
        Rect::xywh(
            content.origin.x + content.size.x - CLOSE_BTN,
            panel.origin.y + (HEADER_H - CLOSE_BTN) / 2.0,
            CLOSE_BTN,
            CLOSE_BTN,
        )
    }

    pub fn search_rect(panel: Rect) -> Rect {
        let content = Self::control_rect(panel);
        Rect::xywh(
            content.origin.x,
            panel.origin.y + HEADER_H + TAB_ROW_H + (SEARCH_ROW_H - CONTROL_H) / 2.0,
            content.size.x,
            CONTROL_H,
        )
    }

    /// Label for one tab chip.
    pub(super) fn tab_label(&self, tab: AssetCenterTab) -> &'static str {
        let translated = op_i18n::translate(self.locale, tab.title_key());
        if translated == tab.title_key() {
            tab.title_fallback()
        } else {
            translated
        }
    }

    /// The tab row's track — one inset trough holding every tab.
    ///
    /// The tabs used to be two free-standing pills, which is the shape of a
    /// *filter* row, not of a mode switch: nothing said the two belonged to
    /// each other or that exactly one of them was ever on. A segmented
    /// control says both by construction.
    pub(super) fn tab_track_rect(&self, panel: Rect) -> Rect {
        let labels: Vec<&str> = AssetCenterTab::ALL
            .into_iter()
            .map(|tab| self.tab_label(tab))
            .collect();
        let track_h = self.tab_track_height_for();
        Rect::xywh(
            Self::content_rect(panel).origin.x,
            panel.origin.y
                + self.header_height_for(panel)
                + (self.tab_row_height_for(panel) - track_h) / 2.0,
            segment_track_width(labels.len(), segment_width_for(&labels)),
            track_h,
        )
    }

    pub(super) fn tab_chip_rects(&self, panel: Rect) -> Vec<(Rect, AssetCenterTab)> {
        segment_rects(self.tab_track_rect(panel), AssetCenterTab::ALL.len())
            .into_iter()
            .zip(AssetCenterTab::ALL)
            .collect()
    }

    /// Which tab a pointer inside the tab row is on, with its index.
    ///
    /// The whole **track** answers, not just the segments: the 3 px trough
    /// padding is part of the control, and a press landing there is a press
    /// on the segment beside it — not a dead band that silently falls
    /// through to "somewhere in the panel".
    pub(super) fn tab_at(&self, panel: Rect, point: Point2D) -> Option<(usize, AssetCenterTab)> {
        let track = self.tab_track_rect(panel);
        if !track.contains(point) {
            return None;
        }
        let segments = self.tab_chip_rects(panel);
        segments
            .iter()
            .position(|(rect, _)| rect.contains(point))
            .or_else(|| {
                // In the padding: attribute it to the nearest segment centre.
                segments
                    .iter()
                    .enumerate()
                    .min_by(|(_, (left, _)), (_, (right, _))| {
                        let distance =
                            |rect: &Rect| (point.x - (rect.origin.x + rect.size.x / 2.0)).abs();
                        distance(left)
                            .partial_cmp(&distance(right))
                            .unwrap_or(std::cmp::Ordering::Equal)
                    })
                    .map(|(index, _)| index)
            })
            .map(|index| (index, segments[index].1))
    }

    /// Whether the prompt-to-deck row paints.
    ///
    /// Two gates, and they answer different questions. The filter gate is
    /// about relevance: the row generates a deck, so it belongs to the slides
    /// scene and to the unfiltered view that contains it — offering it under
    /// "Cards" would promise a deck where the user asked for a card. The
    /// capability gate is about honesty: a host that cannot both replace the
    /// document and launch a chat turn would paint a button whose press goes
    /// nowhere, so it gets no row at all rather than a dead one.
    pub fn generate_row_visible(&self) -> bool {
        self.state.editor_ui.asset_center_generate_supported
    }

    pub(super) fn generate_row_top(&self, panel: Rect) -> f32 {
        panel.origin.y
            + self.header_height_for(panel)
            + self.tab_row_height_for(panel)
            + self.search_row_height_for(panel)
    }

    pub fn generate_input_rect(&self, panel: Rect) -> Option<Rect> {
        if !self.generate_row_visible_in(panel) {
            return None;
        }
        let content = Self::control_rect(panel);
        let reserved = 0.0;
        let input_h = self.generate_input_height_for();
        let button_w = self.generate_button_width_for();
        Some(Rect::xywh(
            content.origin.x + reserved,
            self.generate_row_top(panel) + 6.0,
            (content.size.x - reserved - button_w - GENERATE_GAP).max(0.0),
            input_h,
        ))
    }

    /// Generate button rect, or `None` when the row does not paint.
    pub fn generate_button_rect(&self, panel: Rect) -> Option<Rect> {
        let input = self.generate_input_rect(panel)?;
        Some(Rect::xywh(
            input.origin.x + input.size.x + GENERATE_GAP,
            input.origin.y,
            self.generate_button_width_for(),
            self.generate_input_height_for(),
        ))
    }

    pub(super) fn cards_top(&self, panel: Rect) -> f32 {
        self.generate_row_top(panel) + self.generate_row_height_for(panel)
    }

    pub fn cards_viewport(&self, panel: Rect) -> Rect {
        let content = Self::content_rect(panel);
        let top = self.cards_top(panel);
        Rect::xywh(
            content.origin.x,
            top,
            content.size.x,
            (panel.origin.y + panel.size.y - PAD - top).max(0.0),
        )
    }

    pub(super) fn grid_metrics(&self, panel: Rect) -> (usize, f32, f32) {
        let viewport_w = self.cards_viewport(panel).size.x;
        let columns = self
            .touch_grid_columns(viewport_w)
            .unwrap_or_else(|| grid_columns(viewport_w));
        let card_w = card_width(viewport_w, columns);
        let card_h = self.touch_style_card_height();
        (columns, card_w, card_h)
    }

    /// Largest legal scroll offset for the current result set.
    pub fn max_scroll(&self, panel: Rect) -> f32 {
        (self.style_layout(panel).content_height - self.cards_viewport(panel).size.y).max(0.0)
    }

    /// Caret index for a press inside a text field of this panel.
    pub(super) fn caret_at(
        &self,
        input: &jian_core::text_input::TextInputState,
        rect: Rect,
        pad_x: f32,
        size: f32,
        point: Point2D,
    ) -> usize {
        let text = input.text();
        let relative = (point.x - (rect.origin.x + pad_x)).max(0.0);
        let mut width = 0.0;
        for (index, character) in text.char_indices() {
            let advance = estimated_text_width(&character.to_string(), size);
            if relative < width + advance / 2.0 {
                return index;
            }
            width += advance;
        }
        text.len()
    }

    /// Whether `field` is the one the caret paints in.
    pub(super) fn field_focused(&self, field: AssetCenterFocus) -> bool {
        let center = &self.state.editor_ui.asset_center;
        if !center.input_focus_active {
            return false;
        }
        // A hidden row cannot hold focus: the filter can change under a
        // focused topic field, and a caret blinking in an unpainted input
        // would leave the panel with no visible focus at all.
        if field == AssetCenterFocus::Generate && !self.generate_row_visible() {
            return false;
        }
        if center.focus == AssetCenterFocus::Generate && !self.generate_row_visible() {
            return field == AssetCenterFocus::Search;
        }
        center.focus == field
    }
}

/// Gallery rects the hosts would hand the widget, for tests.
///
/// The panel has no intrinsic size any more, so a test cannot name one; it
/// names the canvas region it is standing in instead. The three widths
/// straddle both [`grid_columns`] breakpoints, which is the whole reason more
/// than one exists.
#[cfg(test)]
pub(super) mod test_rects {
    use crate::{Point2D, Rect};

    /// A 1440x900 canvas region at (40, 60), inset — the laptop case, and the
    /// default fixture. Three columns.
    pub(in crate::widgets) const MEDIUM: Rect = Rect {
        origin: Point2D { x: 64.0, y: 84.0 },
        size: Point2D {
            x: 1392.0,
            y: 852.0,
        },
    };

    /// A 900x700 canvas region at the origin, inset. Two columns.
    pub(in crate::widgets) const NARROW: Rect = Rect {
        origin: Point2D { x: 24.0, y: 24.0 },
        size: Point2D { x: 852.0, y: 652.0 },
    };

    /// A 2200x1200 canvas region at the origin, inset — a large desktop.
    /// Five columns.
    pub(in crate::widgets) const WIDE: Rect = Rect {
        origin: Point2D { x: 24.0, y: 24.0 },
        size: Point2D {
            x: 2152.0,
            y: 1152.0,
        },
    };

    /// The panel a `viewport_w`-wide window hands the gallery, inset on every
    /// side by [`super::ASSET_CENTER_GALLERY_INSET`].
    ///
    /// For the column ladder, which needs more widths than it is worth naming
    /// — including ones no constant here should imply are typical.
    pub(in crate::widgets) fn for_viewport(viewport_w: f32) -> Rect {
        let inset = super::ASSET_CENTER_GALLERY_INSET;
        Rect::xywh(inset, inset, viewport_w - inset * 2.0, 1200.0)
    }
}

pub(super) fn preview_height(card_w: f32) -> f32 {
    (card_w - CARD_PREVIEW_INSET * 2.0).max(0.0) / CARD_PREVIEW_ASPECT
}

pub(super) const FILTER_ROW_H: f32 = 44.0;
pub(super) const GENERATE_INPUT_H: f32 = CONTROL_H;
