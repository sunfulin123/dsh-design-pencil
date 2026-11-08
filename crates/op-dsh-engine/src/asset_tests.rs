use super::*;

#[test]
fn asset_catalog_exposes_complete_host_contracts_without_duplicate_names() {
    let schemas = tool_catalog::schemas();
    for name in [
        "list_scene_templates",
        "get_scene_template",
        "instantiate_scene_template",
        "save_scene_template",
        "rename_scene_template",
        "delete_scene_template",
        "import_design_md",
        "rename_style_guide",
        "delete_style_guide",
        "list_theme_presets",
        "get_theme_preset",
        "save_theme_preset",
        "rename_theme_preset",
        "delete_theme_preset",
        "import_theme_preset",
        "export_theme_preset",
        "load_theme_preset",
        "get_editor_theme",
        "set_editor_theme",
    ] {
        assert_eq!(
            schemas.iter().filter(|s| s["name"] == name).count(),
            1,
            "{name}"
        );
    }
    let style = schemas
        .iter()
        .find(|s| s["name"] == "list_style_guides")
        .unwrap();
    assert!(style["inputSchema"]["properties"]["id"].is_object());
    assert!(style["inputSchema"]["properties"]["tag"].is_object());
}

#[test]
fn design_md_content_alias_writes_and_undoes() {
    let mut engine = DesignEngine::new();
    let before = engine.document_json().unwrap();
    let reply: Value = serde_json::from_str(
        &engine
            .call_tool(
                "set_design_md",
                r##"{"content":"# Design\n\n## Colors\n- Primary: #123456"}"##,
            )
            .unwrap(),
    )
    .unwrap();
    assert_eq!(reply["isError"], false);
    assert_ne!(engine.document_json().unwrap(), before);
    engine.call_tool("undo", "{}").unwrap();
    assert_eq!(engine.document_json().unwrap(), before);
}

#[test]
fn design_md_empty_or_conflicting_aliases_are_errors_without_mutation() {
    let mut engine = DesignEngine::new();
    let before = engine.document_json().unwrap();
    for args in [
        r#"{"content":" "}"#,
        r#"{"markdown":"one","content":"two"}"#,
        "{}",
    ] {
        let reply: Value =
            serde_json::from_str(&engine.call_tool("set_design_md", args).unwrap()).unwrap();
        assert_eq!(reply["isError"], true, "{args}");
        assert_eq!(engine.document_json().unwrap(), before);
    }
}

#[test]
fn get_style_guide_id_is_not_ignored_or_replaced_with_an_unrelated_guide() {
    let mut engine = DesignEngine::new();
    let unknown: Value = serde_json::from_str(
        &engine
            .call_tool("get_style_guide", r#"{"id":"missing-style-id"}"#)
            .unwrap(),
    )
    .unwrap();
    assert_eq!(unknown["isError"], true);
    let guides: Value =
        serde_json::from_str(&engine.builtin_assets_json("style-guide").unwrap()).unwrap();
    let guide = &guides[1];
    let fetched: Value = serde_json::from_str(
        &engine
            .call_tool("get_style_guide", &json!({"id":guide["id"]}).to_string())
            .unwrap(),
    )
    .unwrap();
    assert_eq!(fetched["structuredContent"]["content"], guide["content"]);
}

#[test]
fn template_asset_uses_active_page_variables_and_one_undo() {
    let mut engine = DesignEngine::new();
    let before = engine.document_json().unwrap();
    let payload = json!({
        "name":"Test", "document":{"version":"1.0.0","children":[],
            "variables":{"brand":{"type":"color","value":"#123456"}},
            "pages":[{"id":"unused","name":"Unused","children":[]},
                {"id":"chosen","name":"Chosen","children":[
                    {"id":"board","type":"frame","width":300,"height":200,
                        "fill":[{"type":"solid","color":"$brand"}]}]}],
            "editorMeta":{"activePageIndex":1}}
    });
    let reply: Value = serde_json::from_str(
        &engine
            .apply_asset_json(
                "scene-template",
                &payload.to_string(),
                r#"{"id":"user:test"}"#,
            )
            .unwrap(),
    )
    .unwrap();
    assert_eq!(reply["isError"], false, "{reply}");
    assert_eq!(
        reply["structuredContent"]["nodeIds"]
            .as_array()
            .unwrap()
            .len(),
        1
    );
    let doc: Value = serde_json::from_str(&engine.document_json().unwrap()).unwrap();
    assert!(doc["variables"].get("asset_user_test--brand").is_some());
    engine.call_tool("undo", "{}").unwrap();
    assert_eq!(engine.document_json().unwrap(), before);
}

#[test]
fn theme_asset_merges_in_one_undo_without_changing_builtin_contract() {
    let mut engine = DesignEngine::new();
    let before = engine.document_json().unwrap();
    let payload = json!({"name":"Brand","preset":{
        "type":"openpencil-theme-preset","version":"1.0.0","name":"Brand",
        "themes":{"Mode":["Light","Dark"]},
        "variables":{"brand":{"type":"color","value":"#abcdef"}}
    }});
    let reply: Value = serde_json::from_str(
        &engine
            .apply_asset_json("theme-preset", &payload.to_string(), "{}")
            .unwrap(),
    )
    .unwrap();
    assert_eq!(reply["isError"], false);
    engine.call_tool("undo", "{}").unwrap();
    assert_eq!(engine.document_json().unwrap(), before);
    let builtins: Value =
        serde_json::from_str(&engine.builtin_assets_json("theme-preset").unwrap()).unwrap();
    assert_eq!(builtins.as_array().unwrap().len(), 4);
}

fn apply_test_template(engine: &mut DesignEngine, document: Value) -> Value {
    let reply: Value = serde_json::from_str(
        &engine
            .apply_asset_json(
                "scene-template",
                &json!({"name":"References","document":document}).to_string(),
                r#"{"id":"user:test"}"#,
            )
            .unwrap(),
    )
    .unwrap();
    assert_eq!(reply["isError"], false, "{reply}");
    serde_json::from_str(&engine.document_json().unwrap()).unwrap()
}

#[test]
fn template_aliases_slash_names_and_numeric_formulas_resolve_after_insertion() {
    let mut engine = DesignEngine::new();
    let doc = apply_test_template(
        &mut engine,
        json!({"version":"1.0.0","children":[
        {"id":"board","type":"frame","width":"$double","height":50,
            "fill":[{"type":"solid","color":"$brand"}]},
        {"id":"surface","type":"rectangle","width":50,"height":50,
            "fill":[{"type":"solid","color":"$surface/surface"}]}],
        "variables":{
            "base":{"type":"color","value":"#123456"},
            "brand":{"type":"color","value":"$base"},
            "surface/surface":{"type":"color","value":"#abcdef"},
            "space.unit":{"type":"number","value":8},
            "double":{"type":"number","value":"calc($space.unit * 2)"}
        }}),
    );
    let theme = op_editor_core::variables_resolve::default_theme(engine.state.doc.themes.as_ref());
    for (reference, expected) in [
        (
            doc["children"][0]["fill"][0]["color"].as_str().unwrap(),
            json!("#123456"),
        ),
        (
            doc["children"][1]["fill"][0]["color"].as_str().unwrap(),
            json!("#abcdef"),
        ),
        (doc["children"][0]["width"].as_str().unwrap(), json!(16.0)),
    ] {
        let value = op_editor_core::variables_resolve::resolve_variable_ref(
            reference,
            engine.state.doc.variables.as_ref(),
            &theme,
        );
        assert_eq!(
            value.map(|v| serde_json::to_value(v).unwrap()),
            Some(expected),
            "{reference}"
        );
    }
}

#[test]
fn updated_template_variables_do_not_restyle_previous_instances() {
    let mut engine = DesignEngine::new();
    let document = |color| {
        json!({"version":"1.0.0","children":[
        {"id":"board","type":"frame","width":50,"height":50,
            "fill":[{"type":"solid","color":"$brand"}]}],
        "variables":{"brand":{"type":"color","value":color}}})
    };
    apply_test_template(&mut engine, document("#112233"));
    let doc = apply_test_template(&mut engine, document("#aabbcc"));
    for (index, expected) in ["#112233", "#aabbcc"].iter().enumerate() {
        let reference = doc["children"][index]["fill"][0]["color"].as_str().unwrap();
        let value = op_editor_core::variables_resolve::resolve_variable_ref(
            reference,
            engine.state.doc.variables.as_ref(),
            &Default::default(),
        )
        .unwrap();
        assert_eq!(serde_json::to_value(value).unwrap(), json!(expected));
    }
    engine.call_tool("undo", "{}").unwrap();
    assert_eq!(engine.state.active_children().len(), 1);
}

#[test]
fn template_theme_axes_preserve_default_and_do_not_restyle_existing_themes() {
    let mut engine = DesignEngine::new();
    let before = engine.document_json().unwrap();
    let doc = apply_test_template(
        &mut engine,
        json!({"version":"1.0.0","children":[
        {"id":"board","type":"frame","width":50,"height":50,
            "fill":[{"type":"solid","color":"$brand"}]}],
        "themes":{"Mode":["Light","Dark"]},
        "variables":{"brand":{"type":"color","value":[
            {"value":"#111111","theme":{"Mode":"Dark"}},
            {"value":"#ffffff","theme":{"Mode":"Light"}}]}}}),
    );
    let themes = engine
        .state
        .doc
        .themes
        .as_ref()
        .expect("template theme axes preserved");
    let theme = op_editor_core::variables_resolve::default_theme(Some(themes));
    let reference = doc["children"][0]["fill"][0]["color"].as_str().unwrap();
    let resolve = |theme| {
        serde_json::to_value(
            op_editor_core::variables_resolve::resolve_variable_ref(
                reference,
                engine.state.doc.variables.as_ref(),
                theme,
            )
            .unwrap(),
        )
        .unwrap()
    };
    assert_eq!(resolve(&theme), json!("#ffffff"));
    let mut dark = theme.clone();
    dark.insert(themes.keys().next().unwrap().clone(), "Dark".into());
    assert_eq!(resolve(&dark), json!("#111111"));
    engine.call_tool("undo", "{}").unwrap();
    assert_eq!(engine.document_json().unwrap(), before);
}

#[test]
fn template_theme_selection_is_scoped_and_node_overrides_survive() {
    let mut engine = DesignEngine::new();
    let document = |mode: &str| {
        json!({"version":"1.0.0","children":[
        {"id":"board","type":"frame","width":50,"height":50,
            "fill":[{"type":"solid","color":"$brand"}]},
        {"id":"override","type":"rectangle","width":50,"height":50,
            "theme":{"Mode":"Light"},"fill":[{"type":"solid","color":"$brand"}]}],
        "themes":{"Mode":["Light","Dark"]},"theme":{"Mode":mode},
        "variables":{"brand":{"type":"color","value":[
            {"value":"#111111","theme":{"Mode":"Dark"}},
            {"value":"#ffffff","theme":{"Mode":"Light"}}]}}})
    };
    apply_test_template(&mut engine, document("Light"));
    let before = engine.document_json().unwrap();
    let doc = apply_test_template(&mut engine, document("Dark"));
    assert_eq!(engine.state.doc.themes.as_ref().unwrap().len(), 2);
    let theme =
        op_editor_core::variables_resolve::effective_theme(&engine.state.doc, &Default::default());
    for (index, expected) in ["#ffffff", "#ffffff", "#111111", "#ffffff"]
        .iter()
        .enumerate()
    {
        let node = &doc["children"][index];
        let mut node_theme = theme.clone();
        if let Some(overrides) = node["theme"].as_object() {
            node_theme.extend(
                overrides
                    .iter()
                    .map(|(k, v)| (k.clone(), v.as_str().unwrap().into())),
            );
        }
        let value = op_editor_core::variables_resolve::resolve_variable_ref(
            node["fill"][0]["color"].as_str().unwrap(),
            engine.state.doc.variables.as_ref(),
            &node_theme,
        )
        .unwrap();
        assert_eq!(serde_json::to_value(value).unwrap(), json!(expected));
    }
    engine.call_tool("undo", "{}").unwrap();
    assert_eq!(engine.document_json().unwrap(), before);
}
