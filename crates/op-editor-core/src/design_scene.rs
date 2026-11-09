//! Design document scenarios.
use std::str::FromStr;
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum DesignScene {
    /// Step-by-step instructional cards.
    Tutorial,
    /// Side-by-side before/after comparisons.
    Comparison,
    /// Swipeable multi-card narratives.
    Carousel,
    /// Presentation decks.
    Slides,
    /// Single-board social cards — one finished image, not a sequence.
    ///
    /// Distinct from [`Self::Carousel`]: a carousel's unit of meaning is the
    /// swipe across several boards, so its templates ship a whole sequence. A
    /// card is delivered on its own, which is what makes "title + points +
    /// byline" a complete layout rather than a page of one.
    Card,
    /// Full-width scrolling web pages — marketing sites, product landings.
    ///
    /// Distinct from [`Self::Slides`] in the way that matters here: a deck is
    /// a fixed projector board, a page is one tall surface the reader
    /// scrolls, so the two crop, preview, and generate differently.
    Web,
    /// Long-form vertical graphics — one image read by scrolling.
    ///
    /// Distinct from [`Self::Card`] by reading mode, not by aspect: a card is
    /// taken in at a glance, so its whole argument has to fit one screenful.
    /// An infographic is 2.5-3x its own width and is read top to bottom, which
    /// is what lets it carry a chart, a breakdown and a conclusion in sequence.
    /// Filing both under "卡片" would put a 4:5 social board and a 1:3 scroll
    /// behind the same chip.
    Infographic,
}

impl DesignScene {
    /// The filter row's left-to-right order.
    ///
    /// Two positions are pinned by product decision and must not drift:
    /// **Web is last** and **Slides is second from the right**. Those are the
    /// two heavyweight, least-frequently-picked scenes, so they sit where the
    /// eye lands last. Everything else keeps the order it had — the rule is
    /// "pin those two, leave the rest alone", not "sort by anything".
    pub const ALL: [Self; 7] = [
        Self::Tutorial,
        Self::Comparison,
        Self::Carousel,
        Self::Card,
        Self::Infographic,
        Self::Slides,
        Self::Web,
    ];

    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Tutorial => "tutorial",
            Self::Comparison => "comparison",
            Self::Carousel => "carousel",
            Self::Slides => "slides",
            Self::Card => "card",
            Self::Web => "web",
            Self::Infographic => "infographic",
        }
    }

    /// i18n key for the filter chip label.
    pub const fn title_key(self) -> &'static str {
        match self {
            Self::Tutorial => "designScene.tutorial",
            Self::Comparison => "designScene.comparison",
            Self::Carousel => "designScene.carousel",
            Self::Slides => "designScene.slides",
            Self::Card => "designScene.card",
            Self::Web => "designScene.web",
            Self::Infographic => "designScene.infographic",
        }
    }

    /// Whether the generate row can produce a document of this scene.
    ///
    /// The gate is upstream of the panel: the pipeline picks a canvas from
    /// the request text (`op_orchestrator::detect_design_type`), so a scene
    /// may only offer generation when that classifier has a design type
    /// behind it. Slides qualify because "PPT" triggers one; web pages
    /// qualify because a multi-section landing page is what the classifier
    /// *defaults* to. A card request, by contrast, classifies as a 400 px
    /// Component — offering generation there would hand back a widget where
    /// the card promised a poster. An infographic request triggers no branch
    /// at all, so it would come back as that same default landing page at
    /// 1200 px wide, which is not the 1080-wide scroll the card is showing.
    pub const fn supports_generation(self) -> bool {
        matches!(self, Self::Slides | Self::Web)
    }

    /// Label shown when the catalogue key is not yet translated.
    ///
    /// Chip-sized nouns, not descriptions: the filter row is a single
    /// non-wrapping line. `Carousel` reads "轮播" rather than "知识卡片"
    /// because the latter is what a [`Self::Card`] chip means — two chips
    /// labelled the same thing is worse than a slightly drier word.
    pub const fn title_fallback(self) -> &'static str {
        match self {
            Self::Tutorial => "教程图",
            Self::Comparison => "对比图",
            Self::Carousel => "轮播",
            Self::Slides => "PPT",
            Self::Card => "卡片",
            Self::Web => "网页",
            Self::Infographic => "信息图",
        }
    }
}

impl FromStr for DesignScene {
    type Err = ();

    fn from_str(value: &str) -> Result<Self, Self::Err> {
        match value {
            "tutorial" => Ok(Self::Tutorial),
            "comparison" => Ok(Self::Comparison),
            "carousel" => Ok(Self::Carousel),
            "slides" => Ok(Self::Slides),
            "card" => Ok(Self::Card),
            "web" => Ok(Self::Web),
            "infographic" => Ok(Self::Infographic),
            _ => Err(()),
        }
    }
}
