//! Opt-in structural probe for variable collections in a developer-supplied
//! `.fig`. Prints collection/variable names, modes and value kinds only —
//! never document text.
//!
//! ```text
//! DSH_REAL_FIG=/path/file.fig DSH_PROBE_COLLECTION="Theme" \
//!   cargo test -p op-figma --release --lib fig_variables_probe -- --ignored --nocapture
//! ```

use crate::fig_variables::{read_fig_variables, FigVariableValue};
use std::collections::BTreeMap;

#[test]
#[ignore = "needs DSH_REAL_FIG"]
fn fig_variables_probe() {
    let Ok(path) = std::env::var("DSH_REAL_FIG") else {
        return;
    };
    let only = std::env::var("DSH_PROBE_COLLECTION").ok();
    let table = read_fig_variables(&std::fs::read(path).expect("read .fig")).expect("decode");
    for collection in &table.collections {
        let vars: Vec<_> = table
            .variables
            .iter()
            .filter(|v| v.collection_id == collection.id)
            .collect();
        let modes: Vec<_> = collection.modes.iter().map(|(_, n)| n.as_str()).collect();
        println!(
            "COLLECTION {:?} id={} version={:?} library={} modes={:?} vars={}",
            collection.name,
            collection.id,
            collection.version,
            collection.library,
            modes,
            vars.len()
        );
        let mut groups: BTreeMap<&str, usize> = BTreeMap::new();
        for v in &vars {
            *groups
                .entry(v.name.split('/').next().unwrap_or(""))
                .or_default() += 1;
        }
        println!("  groups={groups:?}");
        if only.as_deref() != Some(collection.name.as_str()) {
            continue;
        }
        for v in &vars {
            let values: Vec<String> = v
                .values
                .iter()
                .map(|(mode, value)| {
                    let mode = collection
                        .modes
                        .iter()
                        .find(|(id, _)| id == mode)
                        .map_or("?", |(_, n)| n.as_str());
                    let value = match value {
                        FigVariableValue::Alias(id) => format!(
                            "-> {}",
                            table.variable(id).map_or(id.as_str(), |t| t.name.as_str())
                        ),
                        other => format!("{other:?}"),
                    };
                    format!("{mode}={value}")
                })
                .collect();
            println!("  {:?} {:?} {}", v.name, v.kind, values.join(" | "));
        }
    }
    println!(
        "collections={} variables={}",
        table.collections.len(),
        table.variables.len()
    );
}

/// Convert the file baked and bound, then compare every resolved solid fill.
///
/// ```text
/// DSH_REAL_FIG=/path/file.fig \
///   cargo test -p op-figma --release --lib fig_binding_fidelity_probe -- --ignored --nocapture
/// ```
#[test]
#[ignore = "needs DSH_REAL_FIG"]
fn fig_binding_fidelity_probe() {
    use jian_ops_schema::style::PenFill;
    let Ok(path) = std::env::var("DSH_REAL_FIG") else {
        return;
    };
    let bytes = std::fs::read(path).expect("read .fig");
    let convert = |bake: bool| {
        crate::paint_vars::BAKE_ONLY.with(|flag| flag.set(bake));
        let import = crate::parse_fig_binary(&bytes, "probe.fig", crate::FigLayoutMode::Preserve)
            .expect("convert");
        crate::paint_vars::BAKE_ONLY.with(|flag| flag.set(false));
        import.document
    };
    fn fills(nodes: &[jian_ops_schema::node::PenNode], out: &mut Vec<(String, String)>) {
        for node in nodes {
            let value = serde_json::to_value(node).unwrap();
            if let Some(list) = value.get("fill").and_then(|f| f.as_array()) {
                for fill in list {
                    if let Ok(PenFill::Solid(solid)) = serde_json::from_value(fill.clone()) {
                        out.push((value["id"].as_str().unwrap_or("").into(), solid.color));
                    }
                }
            }
            if let Some(children) = op_editor_core::pen_node_ext::PenNodeExt::children(node) {
                fills(children, out);
            }
        }
    }
    let collect = |doc: &jian_ops_schema::PenDocument| {
        let mut out = Vec::new();
        for page in doc.pages.iter().flatten() {
            fills(&page.children, &mut out);
        }
        out
    };
    let baked = convert(true);
    let bound = convert(false);
    let bound_fills = collect(&bound);
    let refs = bound_fills
        .iter()
        .filter(|(_, c)| c.starts_with('$'))
        .count();
    let resolved =
        op_editor_core::variables_resolve::resolve_document_for_canvas(&bound, &Default::default());
    let (baked, resolved) = (collect(&baked), collect(&resolved));
    assert_eq!(baked.len(), resolved.len(), "same fill count");
    let norm = |c: &str| c.trim_start_matches('#').to_ascii_uppercase();
    let mismatches: Vec<_> = baked
        .iter()
        .zip(&resolved)
        .filter(|((_, a), (_, b))| norm(a).get(..6) != norm(b).get(..6))
        .collect();
    let unresolved = resolved.iter().filter(|(_, c)| c.starts_with('$')).count();
    println!(
        "variables={} axes={:?} collections={:?} solidFills={} bound={} unresolved={} mismatches={}",
        bound.variables.as_ref().map_or(0, |v| v.len()),
        bound.themes.as_ref().map(|t| t.keys().collect::<Vec<_>>()),
        bound.variable_collections.as_ref().map(|c| c.iter().map(|(k, v)| (k, v.library.clone(), v.variables.len())).collect::<Vec<_>>()),
        baked.len(),
        refs,
        unresolved,
        mismatches.len()
    );
    for ((id, a), (_, b)) in mismatches.iter().take(15) {
        let name = bound_fills
            .iter()
            .find(|(i, _)| i == id)
            .map_or("", |(_, c)| c.as_str());
        let definition = bound
            .variables
            .as_ref()
            .and_then(|v| v.get(name.trim_start_matches('$')))
            .map(|d| serde_json::to_string(d).unwrap_or_default());
        println!("  MISMATCH {id}: baked {a} resolved {b} via {name} = {definition:?}");
        if let Some(target) = definition.as_deref().and_then(|d| d.split("\"$").nth(1)) {
            let target = target.trim_end_matches(|c| c == '"' || c == '}');
            let def = bound.variables.as_ref().and_then(|v| v.get(target));
            println!(
                "    {target} = {}",
                serde_json::to_string(&def).unwrap_or_default()
            );
        }
    }
}

#[test]
#[ignore = "needs DSH_REAL_FIG"]
fn fig_prototype_schema_probe() {
    let Ok(path) = std::env::var("DSH_REAL_FIG") else {
        return;
    };
    let bytes = std::fs::read(&path).expect("read .fig");
    let import = crate::parse_fig_binary(&bytes, "probe.fig", crate::FigLayoutMode::Preserve)
        .expect("parse");
    let doc = &import.document;
    let mut node_ids = std::collections::HashSet::new();
    let mut sections = 0usize;
    let mut reaction_nodes = 0usize;
    let mut nav_actions = 0usize;
    let mut swap_actions = 0usize;
    let mut targets = Vec::new();
    fn walk(
        nodes: &[jian_ops_schema::node::PenNode],
        node_ids: &mut std::collections::HashSet<String>,
        sections: &mut usize,
        reaction_nodes: &mut usize,
        nav_actions: &mut usize,
        swap_actions: &mut usize,
        targets: &mut Vec<String>,
    ) {
        for n in nodes {
            let base = n.node_base();
            node_ids.insert(base.id.clone());
            if base.section == Some(true) {
                *sections += 1;
            }
            if let Some(reactions) = base.reactions.as_ref() {
                *reaction_nodes += 1;
                for r in reactions {
                    for a in &r.actions {
                        if let Some(dst) = a.destination_id.as_ref() {
                            targets.push(dst.clone());
                        }
                        match a.effective_navigation() {
                            Some(jian_ops_schema::prototype::PrototypeNavigation::ChangeTo) => {
                                *swap_actions += 1;
                            }
                            Some(_) => {
                                *nav_actions += 1;
                            }
                            None => {}
                        }
                    }
                }
            }
            if let Some(kids) = op_editor_core::pen_node_ext::PenNodeExt::children(n) {
                walk(
                    kids,
                    node_ids,
                    sections,
                    reaction_nodes,
                    nav_actions,
                    swap_actions,
                    targets,
                );
            }
        }
    }
    for page in doc.pages.iter().flatten() {
        walk(
            &page.children,
            &mut node_ids,
            &mut sections,
            &mut reaction_nodes,
            &mut nav_actions,
            &mut swap_actions,
            &mut targets,
        );
    }
    let dangling = targets.iter().filter(|t| !node_ids.contains(*t)).count();
    let flows = doc.prototype.as_ref().map_or(0, |p| p.flows.len());
    println!(
        "sections={sections} flows={flows} reactionNodes={reaction_nodes} navActions={nav_actions} swapActions={swap_actions} dangling={dangling}"
    );
    assert_eq!(dangling, 0, "all prototype destinationIds must resolve");
}
