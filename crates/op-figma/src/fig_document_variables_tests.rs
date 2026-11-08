use super::*;
use crate::fig_variables::{FigVariable, FigVariableCollection, FigVariableTable};

const PRIMITIVES_KEY: &str = "ac9d7e4f4849181843d10839395415fff97524bf";
const THEME_KEY: &str = "41e63b1b4d7828889d69218999519d12dd769d25";

fn collection(id: &str, name: &str, key: Option<&str>, modes: &[&str]) -> FigVariableCollection {
    FigVariableCollection {
        id: id.into(),
        name: name.into(),
        key: key.map(str::to_string),
        version: Some("1:2".into()),
        library: key.is_some(),
        modes: modes
            .iter()
            .map(|m| (format!("{id}/{m}"), m.to_string()))
            .collect(),
    }
}

fn variable(
    id: &str,
    name: &str,
    collection: &str,
    values: Vec<(&str, FigVariableValue)>,
) -> FigVariable {
    FigVariable {
        id: id.into(),
        name: name.into(),
        collection_id: collection.into(),
        kind: FigVariableType::Color,
        key: None,
        version: None,
        values: values
            .into_iter()
            .map(|(m, v)| (format!("{collection}/{m}"), v))
            .collect(),
    }
}

fn table() -> FigVariableTable {
    FigVariableTable {
        collections: vec![
            collection(
                "key:prim",
                "Color scheme (Primitives)",
                Some(PRIMITIVES_KEY),
                &["Light", "Dark"],
            ),
            collection("key:theme", "Theme", Some(THEME_KEY), &["Talkdesk Theme"]),
            collection("1:1", "Brand", None, &["Default"]),
        ],
        variables: vec![
            variable(
                "key:p9",
                "Colors/Purple/purple-9",
                "key:prim",
                vec![
                    ("Light", FigVariableValue::Color("#5405BDFF".into())),
                    ("Dark", FigVariableValue::Color("#5405BDFF".into())),
                ],
            ),
            variable(
                "key:t9",
                "Colors/Primary/9",
                "key:theme",
                vec![("Talkdesk Theme", FigVariableValue::Alias("key:p9".into()))],
            ),
            variable(
                "1:2",
                "Accent",
                "1:1",
                vec![("Default", FigVariableValue::Color("#12345680".into()))],
            ),
            variable(
                "1:3",
                "Broken",
                "1:1",
                vec![("Default", FigVariableValue::Alias("missing".into()))],
            ),
            variable(
                "1:4",
                "Uses broken",
                "1:1",
                vec![("Default", FigVariableValue::Alias("1:3".into()))],
            ),
        ],
    }
}

#[test]
fn cobalt_collections_link_by_key_and_take_css_names() {
    let out = fig_document_variables(&table());
    assert_eq!(out.names["key:p9"], "--purple-9");
    assert_eq!(out.names["key:t9"], "--primary-9");
    assert_eq!(
        out.variables["--primary-9"].value,
        VariableValue::Scalar(VariableScalar::Str("$--purple-9".into()))
    );
    assert!(
        matches!(out.variables["--purple-9"].value, VariableValue::Themed(ref v) if v.len() == 2)
    );
    assert_eq!(out.themes["Color scheme (Primitives)"], ["Light", "Dark"]);
    assert!(
        !out.themes.contains_key("Theme"),
        "single-mode collections are not axes"
    );
    let linked = &out.collections["Color scheme (Primitives)"];
    assert_eq!(linked.library.as_deref(), Some("talkdesk-cobalt"));
    assert_eq!(
        linked.variables["--purple-9"].name,
        "Colors/Purple/purple-9"
    );
}

#[test]
fn local_variables_keep_figma_names_and_dangling_aliases_drop() {
    let out = fig_document_variables(&table());
    assert_eq!(
        out.variables["Accent"].value,
        VariableValue::Scalar(VariableScalar::Str("#12345680".into()))
    );
    assert_eq!(out.collections["Brand"].library, None);
    assert!(!out.variables.contains_key("Broken"));
    assert!(!out.variables.contains_key("Uses broken"));
    assert!(!out.names.contains_key("1:4"));
}

#[test]
fn file_values_are_kept_so_library_differences_become_updates() {
    let mut t = table();
    t.variables[0].values[0].1 = FigVariableValue::Color("#000000FF".into());
    let mut doc = jian_ops_schema::PenDocument::with_children("1", Vec::new());
    fig_document_variables(&t).apply_to(&mut doc);
    let updates = op_editor_core::variable_library::library_updates(&doc);
    assert!(
        updates.iter().any(|u| u.name == "--purple-9"),
        "{updates:?}"
    );
}
