use super::*;
use crate::variables_resolve::resolve_variable_ref;
use jian_ops_schema::variable::{VariableKind, VariableScalar};
use jian_ops_schema::PenDocument;
use std::collections::BTreeMap;

fn cobalt() -> &'static VariableLibrary {
    library(PREFERRED_LIBRARY_ID).expect("cobalt is built in")
}

fn empty_doc() -> PenDocument {
    crate::EditorState::new().doc
}

fn resolve(doc: &PenDocument, name: &str, mode: &str) -> Option<VariableScalar> {
    let theme = BTreeMap::from([(cobalt::PRIMITIVES.to_string(), mode.to_string())]);
    resolve_variable_ref(&format!("${name}"), doc.variables.as_ref(), &theme)
}

#[test]
fn cobalt_is_first_and_parses_the_modern_token_set() {
    assert_eq!(libraries()[0].id, PREFERRED_LIBRARY_ID);
    let library = cobalt();
    assert_eq!(library.collections[0].name, "Color scheme (Primitives)");
    assert_eq!(library.collections[0].modes, ["Light", "Dark"]);
    assert_eq!(library.collections[1].name, "Theme");
    let count = |prefix: &str| {
        library
            .variables
            .keys()
            .filter(|name| name.starts_with(prefix))
            .count()
    };
    // 12 solid + 12 alpha + 4 supporting per family.
    assert_eq!(count("--purple-"), 28);
    assert_eq!(count("--neutral-"), 28);
    // Six roles × 28 aliases.
    assert_eq!(
        [
            "--primary-",
            "--secondary-",
            "--info-",
            "--success-",
            "--warning-",
            "--error-"
        ]
        .iter()
        .map(|p| count(p))
        .sum::<usize>(),
        168
    );
    // Legacy scales and unresolved aliases never ship.
    for gone in [
        "--primary-500",
        "--gray-100",
        "--basic-800",
        "--foreground-color",
        "--card-border-radius",
    ] {
        assert!(!library.variables.contains_key(gone), "{gone}");
    }
    let total = library.variables.len();
    // Locks the parse of TALKDESK-VARIABLES.md: a changed source must be
    // reviewed, not silently absorbed.
    assert_eq!(total, 582, "Cobalt token count changed");
    let in_collection = |c: &str| {
        library
            .variables
            .values()
            .filter(|v| v.collection == c)
            .count()
    };
    assert_eq!(in_collection("Color scheme (Primitives)"), 288);
    assert_eq!(in_collection("Theme"), 294);
    assert_eq!(
        library.variables["--font-family-base-mono"]
            .definition
            .value,
        jian_ops_schema::variable::VariableValue::Scalar(VariableScalar::Str("Roboto Mono".into()))
    );
}

#[test]
fn every_alias_resolves_in_both_modes() {
    let mut doc = empty_doc();
    let names: Vec<String> = cobalt().variables.keys().cloned().collect();
    import_library_variables(&mut doc, names.clone());
    for name in &names {
        for mode in ["Light", "Dark"] {
            assert!(
                resolve(&doc, name, mode).is_some(),
                "{name} does not resolve in {mode}"
            );
        }
    }
}

#[test]
fn semantic_roles_alias_primitives_and_follow_the_mode() {
    let mut doc = empty_doc();
    import_library_variables(
        &mut doc,
        ["--primary-9".to_string(), "--surface-elevation-1".into()],
    );
    assert_eq!(
        resolve(&doc, "--primary-9", "Light"),
        Some(VariableScalar::Str("#5405BD".into()))
    );
    assert_eq!(
        resolve(&doc, "--surface-elevation-1", "Dark"),
        Some(VariableScalar::Str("#1D2123".into()))
    );
    let theme = &doc.variable_collections.as_ref().unwrap()["Theme"];
    assert_eq!(theme.library.as_deref(), Some(PREFERRED_LIBRARY_ID));
    assert_eq!(theme.variables["--primary-9"].name, "Colors/Primary/9");
    assert_eq!(
        doc.themes.as_ref().unwrap()["Color scheme (Primitives)"],
        ["Light", "Dark"]
    );
    assert_eq!(
        cobalt().variables["--spacing-small"].definition.kind,
        VariableKind::Number
    );
    assert_eq!(
        cobalt().variables["--font-family-base"].definition.value,
        jian_ops_schema::variable::VariableValue::Scalar(VariableScalar::Str("Roboto".into()))
    );
}

#[test]
fn import_brings_only_used_variables_and_keeps_document_values() {
    let mut doc = empty_doc();
    doc.variables = Some(BTreeMap::from([(
        "--purple-9".to_string(),
        jian_ops_schema::variable::VariableDefinition {
            kind: VariableKind::Color,
            value: jian_ops_schema::variable::VariableValue::Scalar(VariableScalar::Str(
                "#000000".into(),
            )),
        },
    )]));
    let text = r#"{"fill":[{"color":"$--primary-9"}],"other":"--not-a-token"}"#;
    let names = referenced_library_names(&doc, text);
    assert_eq!(names.iter().collect::<Vec<_>>(), ["--primary-9"]);
    let added = import_library_variables(&mut doc, names);
    assert_eq!(added, ["--primary-9"]);
    assert_eq!(doc.variables.as_ref().unwrap().len(), 2);
    assert_eq!(
        resolve(&doc, "--primary-9", "Light"),
        Some(VariableScalar::Str("#000000".into()))
    );
}

#[test]
fn library_changes_are_offered_not_applied() {
    let mut doc = empty_doc();
    import_library_variables(&mut doc, ["--spacing-small".to_string()]);
    assert!(library_updates(&doc).is_empty());
    doc.variables.as_mut().unwrap().insert(
        "--spacing-small".into(),
        jian_ops_schema::variable::VariableDefinition {
            kind: VariableKind::Number,
            value: jian_ops_schema::variable::VariableValue::Scalar(VariableScalar::Num(99.0)),
        },
    );
    let updates = library_updates(&doc);
    assert_eq!(updates.len(), 1);
    assert_eq!(updates[0].name, "--spacing-small");
    assert_eq!(accept_library_updates(&mut doc, None), ["--spacing-small"]);
    assert!(library_updates(&doc).is_empty());
}

#[test]
fn rename_detaches_and_delete_forgets_library_members() {
    let mut state = crate::EditorState::new();
    import_library_variables(
        &mut state.doc,
        ["--gray-1".to_string(), "--gray-2".to_string()],
    );
    let members = |state: &crate::EditorState| {
        state
            .doc
            .variable_collections
            .as_ref()
            .map(|c| {
                c.values()
                    .flat_map(|m| m.variables.keys().cloned())
                    .collect::<Vec<_>>()
            })
            .unwrap_or_default()
    };
    assert!(state.rename_variable("--gray-1", "--brand-gray"));
    assert!(!members(&state).contains(&"--gray-1".to_string()));
    assert!(!members(&state).contains(&"--brand-gray".to_string()));
    assert!(state
        .doc
        .variables
        .as_ref()
        .unwrap()
        .contains_key("--brand-gray"));
    assert!(library_updates(&state.doc).is_empty());
    assert!(state.delete_variable("--gray-2"));
    assert!(members(&state).is_empty());
    assert_eq!(state.doc.variable_collections, None);
}
