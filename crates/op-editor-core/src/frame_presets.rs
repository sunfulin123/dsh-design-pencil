//! Shared logical-pixel frame presets for device-sized design and presentation.

pub struct FramePreset {
    pub id: &'static str,
    pub name: &'static str,
    pub width: f32,
    pub height: f32,
    pub phone: bool,
}

impl FramePreset {
    pub fn size(&self, landscape: bool) -> (f32, f32) {
        if landscape {
            (self.height, self.width)
        } else {
            (self.width, self.height)
        }
    }
}

pub const DEVICE_PRESETS: &[FramePreset] = &[
    FramePreset {
        id: "iphone-17",
        name: "iPhone 17",
        width: 402.0,
        height: 874.0,
        phone: true,
    },
    FramePreset {
        id: "iphone-16-17-pro",
        name: "iPhone 16 & 17 Pro",
        width: 402.0,
        height: 874.0,
        phone: true,
    },
    FramePreset {
        id: "iphone-16",
        name: "iPhone 16",
        width: 393.0,
        height: 852.0,
        phone: true,
    },
    FramePreset {
        id: "iphone-16-17-pro-max",
        name: "iPhone 16 & 17 Pro Max",
        width: 440.0,
        height: 956.0,
        phone: true,
    },
    FramePreset {
        id: "iphone-16-plus",
        name: "iPhone 16 Plus",
        width: 430.0,
        height: 932.0,
        phone: true,
    },
    FramePreset {
        id: "iphone-air",
        name: "iPhone Air",
        width: 420.0,
        height: 912.0,
        phone: true,
    },
    FramePreset {
        id: "iphone-14-15-pro-max",
        name: "iPhone 14 & 15 Pro Max",
        width: 430.0,
        height: 932.0,
        phone: true,
    },
    FramePreset {
        id: "iphone-14-15-pro",
        name: "iPhone 14 & 15 Pro",
        width: 393.0,
        height: 852.0,
        phone: true,
    },
    FramePreset {
        id: "iphone-13-14",
        name: "iPhone 13 & 14",
        width: 390.0,
        height: 844.0,
        phone: true,
    },
    FramePreset {
        id: "iphone-14-plus",
        name: "iPhone 14 Plus",
        width: 428.0,
        height: 926.0,
        phone: true,
    },
    FramePreset {
        id: "android-compact",
        name: "Android Compact",
        width: 412.0,
        height: 917.0,
        phone: true,
    },
    FramePreset {
        id: "android-medium",
        name: "Android Medium",
        width: 700.0,
        height: 840.0,
        phone: true,
    },
    FramePreset {
        id: "ipad-mini-8-3",
        name: "iPad mini 8.3",
        width: 744.0,
        height: 1133.0,
        phone: false,
    },
    FramePreset {
        id: "surface-pro-8",
        name: "Surface Pro 8",
        width: 1440.0,
        height: 960.0,
        phone: false,
    },
    FramePreset {
        id: "ipad-pro-11",
        name: "iPad Pro 11\"",
        width: 834.0,
        height: 1194.0,
        phone: false,
    },
    FramePreset {
        id: "ipad-pro-12-9",
        name: "iPad Pro 12.9\"",
        width: 1024.0,
        height: 1366.0,
        phone: false,
    },
    FramePreset {
        id: "android-expanded",
        name: "Android Expanded",
        width: 1280.0,
        height: 800.0,
        phone: false,
    },
    FramePreset {
        id: "iphone-13-mini",
        name: "iPhone 13 mini",
        width: 375.0,
        height: 812.0,
        phone: true,
    },
    FramePreset {
        id: "iphone-se",
        name: "iPhone SE",
        width: 320.0,
        height: 568.0,
        phone: true,
    },
    FramePreset {
        id: "iphone-13-pro-max",
        name: "iPhone 13 Pro Max",
        width: 428.0,
        height: 926.0,
        phone: true,
    },
    FramePreset {
        id: "iphone-13-pro",
        name: "iPhone 13 / 13 Pro",
        width: 390.0,
        height: 844.0,
        phone: true,
    },
    FramePreset {
        id: "iphone-11-pro-max",
        name: "iPhone 11 Pro Max",
        width: 414.0,
        height: 896.0,
        phone: true,
    },
    FramePreset {
        id: "iphone-11-pro-x",
        name: "iPhone 11 Pro / X",
        width: 375.0,
        height: 812.0,
        phone: true,
    },
    FramePreset {
        id: "iphone-8-plus",
        name: "iPhone 8 Plus",
        width: 414.0,
        height: 736.0,
        phone: true,
    },
    FramePreset {
        id: "iphone-8",
        name: "iPhone 8",
        width: 375.0,
        height: 667.0,
        phone: true,
    },
    FramePreset {
        id: "android-small",
        name: "Android Small",
        width: 360.0,
        height: 640.0,
        phone: true,
    },
    FramePreset {
        id: "android-large",
        name: "Android Large",
        width: 360.0,
        height: 800.0,
        phone: true,
    },
    FramePreset {
        id: "google-pixel-2",
        name: "Google Pixel 2",
        width: 411.0,
        height: 731.0,
        phone: true,
    },
    FramePreset {
        id: "google-pixel-2-xl",
        name: "Google Pixel 2 XL",
        width: 411.0,
        height: 823.0,
        phone: true,
    },
    FramePreset {
        id: "ipad-mini-5",
        name: "iPad mini 5",
        width: 768.0,
        height: 1024.0,
        phone: false,
    },
    FramePreset {
        id: "surface-pro-4",
        name: "Surface Pro 4",
        width: 1368.0,
        height: 912.0,
        phone: false,
    },
];

pub fn find_device_for_width(width: f32) -> Option<usize> {
    DEVICE_PRESETS
        .iter()
        .position(|preset| (preset.width - width).abs() < 0.5)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn device_presets_match_width_and_preserve_known_model_sizes() {
        let iphone = find_device_for_width(402.0).unwrap();
        assert_eq!(DEVICE_PRESETS[iphone].name, "iPhone 17");
        assert_eq!(DEVICE_PRESETS[iphone].size(false), (402.0, 874.0));
        assert_eq!(DEVICE_PRESETS[iphone].size(true), (874.0, 402.0));
        assert_eq!(
            DEVICE_PRESETS[find_device_for_width(390.0).unwrap()].size(false),
            (390.0, 844.0)
        );
        assert_eq!(
            DEVICE_PRESETS[find_device_for_width(1024.0).unwrap()].size(false),
            (1024.0, 1366.0)
        );
        assert!(find_device_for_width(1441.0).is_none());
        assert!(find_device_for_width(f32::NAN).is_none());
        assert_eq!(
            DEVICE_PRESETS
                .iter()
                .filter(|preset| preset.id == "iphone-se")
                .count(),
            1
        );
    }
}
