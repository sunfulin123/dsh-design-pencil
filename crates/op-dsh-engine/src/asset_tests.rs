use super::*;

#[test]
fn asset_catalog_exposes_complete_host_contracts_without_duplicate_names() {
    let schemas = tool_catalog::schemas();
    for name in [
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
    assert!(!schemas
        .iter()
        .any(|s| s["name"].as_str().unwrap().contains("scene_template")));
    let mut engine = DesignEngine::new();
    let removed: Value = serde_json::from_str(
        &engine
            .call_tool("save_scene_template", "{\"name\":\"Removed\"}")
            .unwrap(),
    )
    .unwrap();
    assert_eq!(removed["isError"], true);
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
fn builtin_style_assets_expose_preview_from_their_own_guide() {
    let engine = DesignEngine::new();
    let guides: Value =
        serde_json::from_str(&engine.builtin_assets_json("style-guide").unwrap()).unwrap();
    let guide = guides
        .as_array()
        .unwrap()
        .iter()
        .find(|guide| guide["id"] == "talkdesk-cobalt")
        .unwrap();
    let expected = op_ai_skills::style_guide::style_guide_card("talkdesk-cobalt").unwrap();
    assert_eq!(guide["swatches"], json!(expected.swatches));
    assert!(!guide["swatches"].as_array().unwrap().is_empty());
    assert_eq!(guide["summary"], json!(expected.description));
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
