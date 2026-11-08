//! Opt-in probe against a real `.fig` the developer supplies locally. It
//! embeds no design data: the file path and probe strings come from the
//! environment and only counts are printed.
//!
//! ```text
//! DSH_REAL_FIG=/path/file.fig DSH_PROBE_TEXTS="a,b" \
//!   cargo test -p op-figma --release --lib real_file_probe -- --ignored --nocapture
//! ```

use crate::{parse_fig_binary, parse_fig_binary_linked, FigLayoutMode};
use std::collections::BTreeMap;

fn count_texts(
    value: &serde_json::Value,
    probes: &[String],
    hits: &mut [usize],
    total: &mut usize,
) {
    match value {
        serde_json::Value::Object(map) => {
            *total += 1;
            if map.get("type").and_then(|t| t.as_str()) == Some("text") {
                let content = map
                    .get("content")
                    .map(|c| c.to_string())
                    .unwrap_or_default();
                for (probe, hit) in probes.iter().zip(hits.iter_mut()) {
                    if content.contains(probe.as_str()) {
                        *hit += 1;
                    }
                }
            }
            for (key, child) in map {
                if key == "children" || key == "pages" {
                    count_texts(child, probes, hits, total);
                }
            }
        }
        serde_json::Value::Array(items) => {
            for item in items {
                count_texts(item, probes, hits, total);
            }
        }
        _ => {}
    }
}

#[test]
#[ignore = "needs DSH_REAL_FIG"]
fn real_file_probe() {
    let Ok(path) = std::env::var("DSH_REAL_FIG") else {
        return;
    };
    let probes: Vec<String> = std::env::var("DSH_PROBE_TEXTS")
        .unwrap_or_default()
        .split(',')
        .filter(|s| !s.is_empty())
        .map(str::to_string)
        .collect();
    let bytes = std::fs::read(path).expect("read .fig");
    let started = std::time::Instant::now();
    let import = if std::env::var("DSH_PROBE_LINKED").is_ok() {
        parse_fig_binary_linked(&bytes, "probe", FigLayoutMode::Preserve)
    } else {
        parse_fig_binary(&bytes, "probe", FigLayoutMode::Preserve)
    }
    .expect("parse");
    let elapsed = started.elapsed();
    let json = serde_json::to_value(&import.document).unwrap();
    if let Ok(out) = std::env::var("DSH_PROBE_DOC_OUT") {
        std::fs::write(&out, serde_json::to_vec(&json).unwrap()).expect("write document");
    }
    let mut hits = vec![0; probes.len()];
    let mut total = 0;
    count_texts(&json, &probes, &mut hits, &mut total);
    let mut warnings: BTreeMap<String, usize> = BTreeMap::new();
    for warning in &import.warnings {
        let kind: String = warning
            .split('"')
            .next()
            .unwrap_or("")
            .chars()
            .take(260)
            .collect();
        *warnings.entry(kind).or_default() += 1;
    }
    println!("PROBE elapsed_ms={} nodes={total}", elapsed.as_millis());
    for (probe, hit) in probes.iter().zip(&hits) {
        println!("PROBE text[{probe}]={hit}");
    }
    for (kind, count) in warnings {
        println!("PROBE warning[{kind}]={count}");
    }
    if let (Ok(name), Ok(out)) = (
        std::env::var("DSH_PROBE_DUMP_NAME"),
        std::env::var("DSH_PROBE_DUMP_OUT"),
    ) {
        let mut found = Vec::new();
        collect_named(&json, &name, &mut found);
        std::fs::write(&out, serde_json::to_vec(&found).unwrap()).expect("write dump");
        println!("PROBE dumped={}", found.len());
    }
}

fn collect_named(value: &serde_json::Value, name: &str, out: &mut Vec<serde_json::Value>) {
    match value {
        serde_json::Value::Object(map) => {
            if map.get("name").and_then(|n| n.as_str()) == Some(name) {
                out.push(value.clone());
            }
            for (key, child) in map {
                if key == "children" || key == "pages" {
                    collect_named(child, name, out);
                }
            }
        }
        serde_json::Value::Array(items) => items.iter().for_each(|i| collect_named(i, name, out)),
        _ => {}
    }
}
