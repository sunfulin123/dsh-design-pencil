//! Post-style-resolution compaction for transient Figma text layout caches.

use crate::kiwi::FigValue;

/// Drop decoded layout caches after they have served style resolution.
///
/// Figma repeats glyph, baseline, and font metadata under both direct
/// text nodes and instance-derived entries. Conversion only needs the
/// direct cache while resolving linked text metrics. Instance matching
/// subsequently observes `derivedTextData` presence as a text-target
/// marker and optionally reads `characters`, so retain exactly that
/// compact semantic payload in nested entries.
pub(crate) fn compact_transient_text_caches(node_changes: &mut [FigValue]) {
    for node in node_changes {
        let FigValue::Object(fields) = node else {
            continue;
        };
        for (name, value) in fields.iter_mut() {
            if matches!(name.as_ref(), "derivedSymbolData" | "symbolData") {
                compact_instance_text_caches(value);
            }
        }
        let old_len = fields.len();
        fields.retain(|(name, _)| {
            !matches!(name.as_ref(), "derivedTextData" | "legacyDerivedTextData")
        });
        if fields.len() != old_len {
            fields.shrink_to_fit();
        }
    }
}

fn compact_instance_text_caches(value: &mut FigValue) {
    match value {
        FigValue::Array(values) => {
            for value in values {
                compact_instance_text_caches(value);
            }
        }
        FigValue::Object(fields) => {
            for (name, child) in fields.iter_mut() {
                if name.as_ref() == "derivedTextData" {
                    compact_derived_text_data(child);
                } else {
                    compact_instance_text_caches(child);
                }
            }
            let old_len = fields.len();
            fields.retain(|(name, _)| name.as_ref() != "legacyDerivedTextData");
            if fields.len() != old_len {
                fields.shrink_to_fit();
            }
        }
        _ => {}
    }
}

/// Keep the semantic payload: `characters`, the resolved box
/// (`layoutSize`), and one glyph carrying the font size when every glyph
/// shares it (a scaled instance's label records its size only there).
fn compact_derived_text_data(value: &mut FigValue) {
    let FigValue::Object(fields) = value else {
        return;
    };
    let uniform_glyph = fields
        .iter()
        .find(|(name, _)| name.as_ref() == "glyphs")
        .and_then(|(_, glyphs)| uniform_font_size(glyphs));
    fields.retain(|(name, _)| matches!(name.as_ref(), "characters" | "layoutSize"));
    if let Some(size) = uniform_glyph {
        let glyph = FigValue::Object(vec![("fontSize".into(), FigValue::Float(size))]);
        fields.push(("glyphs".into(), FigValue::Array(vec![glyph])));
    }
    fields.shrink_to_fit();
}

fn uniform_font_size(glyphs: &FigValue) -> Option<f32> {
    let FigValue::Array(glyphs) = glyphs else {
        return None;
    };
    let mut sizes = glyphs.iter().filter_map(|glyph| glyph.get_f64("fontSize"));
    let first = sizes.next()?;
    sizes
        .all(|size| (size - first).abs() < 0.01)
        .then_some(first as f32)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn object(fields: Vec<(&str, FigValue)>) -> FigValue {
        FigValue::Object(
            fields
                .into_iter()
                .map(|(name, value)| (name.into(), value))
                .collect(),
        )
    }

    #[test]
    fn drops_layout_only_caches_but_keeps_instance_text_semantics() {
        let with_characters = object(vec![
            ("characters", FigValue::Str("Updated".into())),
            (
                "glyphs",
                FigValue::Array(vec![object(vec![("fontSize", FigValue::Float(16.0))])]),
            ),
            (
                "fontMetaData",
                FigValue::Array(vec![object(vec![(
                    "family",
                    FigValue::Str("Inter".into()),
                )])]),
            ),
        ]);
        let marker = object(vec![(
            "glyphs",
            FigValue::Array(vec![object(vec![("fontSize", FigValue::Float(12.0))])]),
        )]);
        let mut changes = vec![object(vec![
            ("derivedTextData", marker.clone()),
            ("legacyDerivedTextData", marker.clone()),
            (
                "derivedSymbolData",
                FigValue::Array(vec![
                    object(vec![
                        ("size", object(vec![("x", FigValue::Float(10.0))])),
                        ("derivedTextData", with_characters),
                        ("legacyDerivedTextData", marker.clone()),
                    ]),
                    object(vec![("derivedTextData", marker)]),
                ]),
            ),
        ])];

        compact_transient_text_caches(&mut changes);

        assert!(changes[0].get("derivedTextData").is_none());
        assert!(changes[0].get("legacyDerivedTextData").is_none());
        let entries = changes[0]
            .get_array("derivedSymbolData")
            .expect("derived entries survive");
        assert_eq!(
            entries[0].get("size").and_then(|value| value.get_f64("x")),
            Some(10.0)
        );
        let compact_text = entries[0]
            .get("derivedTextData")
            .expect("text marker survives");
        assert_eq!(compact_text.get_str("characters"), Some("Updated"));
        // One glyph summarises a uniform font size; per-glyph data is dropped.
        let glyphs = compact_text
            .get_array("glyphs")
            .expect("uniform glyph size");
        assert_eq!(glyphs.len(), 1);
        assert_eq!(glyphs[0].get_f64("fontSize"), Some(16.0));
        assert!(compact_text.get("fontMetaData").is_none());
        assert!(entries[0].get("legacyDerivedTextData").is_none());
        assert!(entries[1]
            .get("derivedTextData")
            .is_some_and(FigValue::is_object));
    }
}
