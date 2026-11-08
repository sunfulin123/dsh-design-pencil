//! Validated interface scale preference. Camera and document units stay separate.

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum UiScale {
    #[default]
    Percent100,
    Percent110,
    Percent125,
    Percent150,
}

impl UiScale {
    pub const SUPPORTED: [u16; 4] = [100, 110, 125, 150];

    pub const fn from_percent(percent: u16) -> Option<Self> {
        match percent {
            100 => Some(Self::Percent100),
            110 => Some(Self::Percent110),
            125 => Some(Self::Percent125),
            150 => Some(Self::Percent150),
            _ => None,
        }
    }

    pub const fn percent(self) -> u16 {
        match self {
            Self::Percent100 => 100,
            Self::Percent110 => 110,
            Self::Percent125 => 125,
            Self::Percent150 => 150,
        }
    }

    pub fn factor(self) -> f32 {
        self.percent() as f32 / 100.0
    }
}

impl super::EditorUiState {
    pub(crate) fn set_ui_scale_percent(&mut self, percent: u16) -> bool {
        let Some(scale) = UiScale::from_percent(percent) else {
            return false;
        };
        let changed = self.ui_scale != scale;
        self.ui_scale = scale;
        changed
    }
}
