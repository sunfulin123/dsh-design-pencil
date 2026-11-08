use super::*;

fn obj(pairs: Vec<(&str, FigValue)>) -> FigValue {
    FigValue::Object(pairs.into_iter().map(|(k, v)| (k.into(), v)).collect())
}
fn guid(sid: u32, lid: u32) -> FigValue {
    obj(vec![
        ("sessionID", FigValue::Uint(sid)),
        ("localID", FigValue::Uint(lid)),
    ])
}
fn s(v: &str) -> FigValue {
    FigValue::Str(v.into())
}
fn asset(key: &str, version: &str) -> FigValue {
    obj(vec![(
        "assetRef",
        obj(vec![("key", s(key)), ("version", s(version))]),
    )])
}
fn set(lid: u32, name: &str, key: &str, version: &str) -> FigValue {
    obj(vec![
        ("guid", guid(9, lid)),
        ("type", s("VARIABLE_SET")),
        ("name", s(name)),
        ("key", s(key)),
        ("version", s(version)),
        ("sourceLibraryKey", s("lk-1")),
        (
            "variableSetModes",
            FigValue::Array(vec![
                obj(vec![("id", guid(1, 2)), ("name", s("Light"))]),
                obj(vec![("id", guid(1, 3)), ("name", s("Dark"))]),
            ]),
        ),
    ])
}
fn color(r: f32) -> FigValue {
    obj(vec![(
        "colorValue",
        obj(vec![
            ("r", FigValue::Float(r)),
            ("g", FigValue::Float(0.0)),
            ("b", FigValue::Float(0.0)),
            ("a", FigValue::Float(1.0)),
        ]),
    )])
}
fn entry(mode: u32, value: FigValue) -> FigValue {
    obj(vec![
        ("modeID", guid(1, mode)),
        ("variableData", obj(vec![("value", value)])),
    ])
}
fn variable(lid: u32, name: &str, key: &str, version: &str, values: Vec<FigValue>) -> FigValue {
    obj(vec![
        ("guid", guid(8, lid)),
        ("type", s("VARIABLE")),
        ("name", s(name)),
        ("key", s(key)),
        ("version", s(version)),
        ("variableSetID", asset("set", "2:1")),
        ("variableResolvedType", s("COLOR")),
        (
            "variableDataValues",
            obj(vec![("entries", FigValue::Array(values))]),
        ),
    ])
}

#[test]
fn keeps_newest_library_versions_modes_and_aliases() {
    let alias = obj(vec![("alias", asset("purple", "1:1"))]);
    let table = variables_from_node_changes(&[
        set(1, "Old name", "set", "1:9"),
        set(2, "Color scheme (Primitives)", "set", "2:1"),
        variable(
            1,
            "purple/purple-9",
            "purple",
            "1:1",
            vec![entry(2, color(0.0))],
        ),
        variable(
            2,
            "purple/purple-9",
            "purple",
            "3:1",
            vec![entry(2, color(1.0)), entry(3, color(0.5))],
        ),
        variable(
            3,
            "primary/primary-9",
            "primary",
            "1:1",
            vec![entry(2, alias)],
        ),
    ]);
    assert_eq!(table.collections.len(), 1);
    let collection = &table.collections[0];
    assert_eq!(collection.name, "Color scheme (Primitives)");
    assert_eq!(collection.id, "key:set");
    assert!(collection.library);
    assert_eq!(collection.modes[1].1, "Dark");
    let purple = table.variable("key:purple").expect("newest purple");
    assert_eq!(purple.version.as_deref(), Some("3:1"));
    assert_eq!(purple.collection_id, "key:set");
    assert_eq!(
        purple.values[0].1,
        FigVariableValue::Color("#FF0000FF".into())
    );
    assert_eq!(
        purple.values[1].1,
        FigVariableValue::Color("#800000FF".into())
    );
    let primary = table.variable("key:primary").expect("primary");
    assert_eq!(
        primary.values[0].1,
        FigVariableValue::Alias("key:purple".into())
    );
}

#[test]
fn rejects_non_fig_bytes() {
    assert!(read_fig_variables(b"not a fig").is_err());
}
