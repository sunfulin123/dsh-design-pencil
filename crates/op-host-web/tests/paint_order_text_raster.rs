//! CanvasKit bridge browser-text raster cache contracts, split from
//! `paint_order.rs` to keep both files under the 800-line cap.

#[test]
fn canvaskit_browser_text_raster_key_drops_color_and_alpha() {
    let source = std::fs::read_to_string(format!(
        "{}/src/op_ck_bridge.js",
        env!("CARGO_MANIFEST_DIR")
    ))
    .expect("CanvasKit bridge source is readable");

    // Text keys omit colour so differently tinted runs reuse one raster.
    assert!(
        source.contains(": [t, sz, weight, italic ? 1 : 0, ss, family].join('\\n');"),
        "text raster cache key must contain no colour/alpha component"
    );
    assert!(
        source.contains(": 'rgba(255, 255, 255, 1)';"),
        "text glyph run must rasterize as a white full-alpha coverage mask"
    );
    // Only emoji retain the legacy RGBA-keyed raster path.
    assert!(
        !source.contains("const key = [t, sz, weight, italic ? 1 : 0, r, g, b, a, ss]"),
        "the always-RGBA-keyed raster cache (the thrash source) must be gone"
    );
    // Colour glyphs ignore fillStyle, so tinting a white mask would flatten them.
    assert!(
        source.contains(
            "const browserTextImage = (t, sz, weight, italic, emoji, r, g, b, a, family = '') =>"
        ),
        "browserTextImage must take an `emoji` selector + colour for the legacy emoji path"
    );
    assert!(
        source.contains("['e', t, sz, weight, italic ? 1 : 0, r, g, b, a, ss, family].join('\\n')"),
        "emoji segments must keep a colour-keyed raster (legacy baked-colour path)"
    );
    assert!(
        source.contains("`rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`"),
        "emoji branch must bake the requested colour into fillStyle (colour glyphs ignore a white mask + tint)"
    );
}

#[test]
fn canvaskit_text_rasters_reuse_quantized_effective_scale() {
    let source = std::fs::read_to_string(format!(
        "{}/src/op_ck_bridge.js",
        env!("CARGO_MANIFEST_DIR")
    ))
    .expect("CanvasKit bridge source is readable");

    let scale_fn = source
        .find("const effectiveTextScale = () =>")
        .expect("effective text scale helper exists");
    let image_fn = source
        .find("const browserTextImage = (t, sz, weight, italic, emoji, r, g, b, a, family = '') =>")
        .expect("browserTextImage exists");
    let image_end = source[image_fn..]
        .find("const TINT_FILTER_CACHE_CAP = 64;")
        .expect("browserTextImage ends before the tint-filter cache")
        + image_fn;
    let scale_body = &source[scale_fn..image_fn];
    let image_body = &source[image_fn..image_end];
    for marker in [
        "const m = canvas.getTotalMatrix();",
        "const xScale = Math.hypot(m[0], m[3]);",
        "const yScale = Math.hypot(m[1], m[4]);",
        "return Math.max(1, xScale, yScale);",
    ] {
        assert!(
            scale_body.contains(marker),
            "effective text scale must preserve `{marker}` for rotated/non-uniform transforms"
        );
    }
    assert!(
        source.contains("const TEXT_SCALE_STEPS_PER_OCTAVE = 4;")
            && source.contains("export function opCkQuantizeTextRasterScale(scale)")
            && source.contains("Math.log2(finiteScale) * TEXT_SCALE_STEPS_PER_OCTAVE - 1e-9")
            && scale_body.contains("const browserTextRasterScale = () =>")
            && scale_body.contains("opCkQuantizeTextRasterScale(effectiveTextScale())"),
        "browser text raster scale must round up to reusable quarter-octave buckets"
    );
    assert!(
        image_body.contains("const ss = browserTextRasterScale();"),
        "browserTextImage must supersample at the quantized effective scale"
    );
    for forbidden in ["clearBrowserTextCache()", "browserTextCache.clear()"] {
        assert!(
            !scale_body.contains(forbidden) && !image_body.contains(forbidden),
            "effective-scale changes must partition the LRU by `ss`, not call `{forbidden}` per draw"
        );
    }

    for marker in [
        "['e', t, sz, weight, italic ? 1 : 0, r, g, b, a, ss, family].join('\\n')",
        ": [t, sz, weight, italic ? 1 : 0, ss, family].join('\\n');",
    ] {
        assert!(
            image_body.contains(marker),
            "text raster key must preserve `{marker}`"
        );
    }
    assert!(
        !image_body.contains("[t, sz, weight, italic ? 1 : 0, r, g, b, a, ss]"),
        "ordinary text raster keys must remain colour-independent"
    );

    let clear_fn = source
        .find("const clearBrowserTextCache = () =>")
        .expect("browser text cache cleanup helper exists");
    let text_dpr = source[clear_fn..]
        .find("let textDpr = 1;")
        .expect("cache cleanup helper ends before textDpr state")
        + clear_fn;
    let clear_body = &source[clear_fn..text_dpr];
    let delete = clear_body
        .find("entry.image.delete()")
        .expect("cache cleanup deletes CanvasKit image handles");
    let clear = clear_body[delete..]
        .find("browserTextCache.clear();")
        .expect("cache cleanup clears the map")
        + delete;
    let set_dpr = source.find("setDpr(v)").expect("setDpr bridge exists");
    let set_dpr_end = source[set_dpr..]
        .find("\n    },")
        .expect("setDpr method has a local end boundary")
        + set_dpr;
    let set_dpr_body = &source[set_dpr..set_dpr_end];
    let clear_call = set_dpr_body
        .find("clearBrowserTextCache();")
        .expect("DPR changes clear stale text rasters");
    assert!(delete < clear && clear_call < set_dpr_body.len());
    // Only DPR changes and bridge teardown may drop every text raster.
    let dispose = source
        .find("dispose() {\n      if (disposed) return;")
        .expect("bridge dispose exists");
    let dispose_end = source[dispose..]
        .find("\n    },")
        .expect("dispose method has a local end boundary")
        + dispose;
    assert!(source[dispose..dispose_end].contains("clearBrowserTextCache();"));
    assert_eq!(
        source.matches("clearBrowserTextCache();").count(),
        2,
        "setDpr and dispose must be the only call sites that clear all browser text rasters"
    );
    assert_eq!(
        source.matches("browserTextCache.clear();").count(),
        1,
        "only the handle-safe cleanup helper may clear the browser text raster map"
    );

    let eviction = image_body
        .find("if (browserTextCache.size > 512)")
        .expect("browser text raster cache remains bounded");
    assert!(
        image_body[eviction..].contains("old.image.delete()"),
        "LRU eviction must keep deleting the evicted CanvasKit image handle"
    );
}

#[test]
fn canvaskit_browser_text_cache_is_lru() {
    let source = std::fs::read_to_string(format!(
        "{}/src/op_ck_bridge.js",
        env!("CARGO_MANIFEST_DIR")
    ))
    .expect("CanvasKit bridge source is readable");

    // Cache hits reinsert entries so eviction remains LRU rather than FIFO.
    let image_fn = source
        .find("const browserTextImage = (t, sz, weight, italic, emoji, r, g, b, a, family = '') =>")
        .expect("browserTextImage marker exists");
    let hit = source[image_fn..]
        .find("const hit = browserTextCache.get(key);")
        .expect("browserTextImage looks up the cache before rasterizing")
        + image_fn;
    let reinsert_delete = source[hit..]
        .find("browserTextCache.delete(key);")
        .expect("LRU hit re-inserts by deleting first")
        + hit;
    let reinsert_set = source[reinsert_delete..]
        .find("browserTextCache.set(key, hit);")
        .expect("LRU hit re-inserts to move the entry to most-recent")
        + reinsert_delete;
    // Eviction still deletes the wasm image handle of the dropped entry.
    let evict = source[reinsert_set..]
        .find("if (browserTextCache.size > 512)")
        .expect("512-cap eviction still bounds the raster cache")
        + reinsert_set;
    let evict_delete = source[evict..]
        .find("old.image.delete()")
        .expect("evicted raster image handle is deleted")
        + evict;
    assert!(
        hit < reinsert_delete
            && reinsert_delete < reinsert_set
            && reinsert_set < evict
            && evict < evict_delete,
        "browser text raster cache must be LRU (re-insert on hit) and delete evicted image handles"
    );
}

#[test]
fn canvaskit_text_tint_color_filter_cache_is_bounded_and_freed() {
    let source = std::fs::read_to_string(format!(
        "{}/src/op_ck_bridge.js",
        env!("CARGO_MANIFEST_DIR")
    ))
    .expect("CanvasKit bridge source is readable");

    // The bounded white-mask SrcIn cache keys RGB; alpha rides the paint.
    for marker in [
        "const TINT_FILTER_CACHE_CAP = 64;",
        "const tintFilterCache = new Map();",
        "const tintColorFilter = (r, g, b) =>",
        "CK.ColorFilter.MakeBlend(col(r, g, b, 1), CK.BlendMode.SrcIn)",
        "const key = r + '\\n' + g + '\\n' + b;",
    ] {
        assert!(
            source.contains(marker),
            "tint filter cache must preserve `{marker}` (rgb-keyed SrcIn blend, bounded LRU)"
        );
    }

    // LRU re-insert on hit + delete on eviction, mirroring svgPathCache hygiene.
    let cache_fn = source
        .find("const tintColorFilter = (r, g, b) =>")
        .expect("tintColorFilter marker exists");
    let hit = source[cache_fn..]
        .find("const hit = tintFilterCache.get(key);")
        .expect("tintColorFilter looks up the cache")
        + cache_fn;
    let reinsert = source[hit..]
        .find("tintFilterCache.set(key, hit);")
        .expect("tint filter LRU re-inserts on hit")
        + hit;
    let evict = source[reinsert..]
        .find("if (tintFilterCache.size > TINT_FILTER_CACHE_CAP)")
        .expect("tint filter cache is bounded")
        + reinsert;
    let evict_delete = source[evict..]
        .find("old.delete()")
        .expect("evicted ColorFilter wasm handle is deleted")
        + evict;
    assert!(
        hit < reinsert && reinsert < evict && evict < evict_delete,
        "tint ColorFilter cache must be LRU and delete evicted wasm handles"
    );

    // Draw site: dedicated tint paint (not the shared fill paint) applies the
    // filter + opacity, then draws the raster with that paint.
    for marker in [
        "const cachedTintPaint = new CK.Paint();",
        "paint.setColorFilter(tintColorFilter(r, g, b) || null);",
        "paint.setAlphaf(a < 0 ? 0 : a > 1 ? 1 : a);",
        "canvas.drawImage(entry.image, 0, 0, paint);",
        "opCkSnapTextRasterOrigin(x - 2, y - entry.baseline, canvas.getTotalMatrix())",
        "canvas.drawImage(entry.image, originX, originY, paint);",
    ] {
        assert!(
            source.contains(marker),
            "drawBrowserText must preserve `{marker}` (tint-at-draw via dedicated paint)"
        );
    }
    // The tint paint must not alias the shared fill/stroke paints.
    assert!(
        !source.contains("const cachedTintPaint = cachedFillPaint"),
        "tint paint must be its own object, not an alias of the shared fill paint"
    );
}
