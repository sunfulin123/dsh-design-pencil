//! Counters for out-of-band changes to how already-built scenes paint.
//! Retained canvas rasters compare them to know what to redraw: an image
//! decode only affects rasters made while decodes were pending, a font
//! registration affects every raster.

use std::sync::atomic::{AtomicU64, Ordering};

static IMAGES: AtomicU64 = AtomicU64::new(0);
static FONTS: AtomicU64 = AtomicU64::new(0);

/// An image finished (or failed) decoding.
pub fn bump() {
    IMAGES.fetch_add(1, Ordering::Relaxed);
}

/// A font was registered.
pub fn bump_fonts() {
    FONTS.fetch_add(1, Ordering::Relaxed);
}

/// `(image epoch, font epoch)`.
pub fn current() -> (u64, u64) {
    (
        IMAGES.load(Ordering::Relaxed),
        FONTS.load(Ordering::Relaxed),
    )
}
