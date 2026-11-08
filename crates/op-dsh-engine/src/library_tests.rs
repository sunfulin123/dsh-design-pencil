use super::*;

fn reply(engine: &mut DesignEngine, name: &str, args: Value) -> Value {
    serde_json::from_str(&engine.call_tool(name, &args.to_string()).unwrap()).unwrap()
}

fn call(engine: &mut DesignEngine, name: &str, args: Value) -> Value {
    let result = reply(engine, name, args);
    assert_eq!(result["isError"], false, "{name}: {result}");
    result["structuredContent"].clone()
}

fn document(engine: &DesignEngine) -> Value {
    serde_json::from_str(&engine.document_json().unwrap()).unwrap()
}

#[test]
fn library_tools_are_discoverable_and_cobalt_is_first() {
    let schemas = tool_catalog::schemas();
    for name in [
        "list_libraries",
        "list_library_variables",
        "import_library_variables",
        "get_library_updates",
        "accept_library_updates",
    ] {
        assert_eq!(
            schemas.iter().filter(|s| s["name"] == name).count(),
            1,
            "{name}"
        );
    }
    let mut engine = DesignEngine::new();
    let libraries = call(&mut engine, "list_libraries", json!({}));
    assert_eq!(libraries["libraries"][0]["id"], "talkdesk-cobalt");
    assert_eq!(libraries["libraries"][0]["preferred"], true);
    let page = call(
        &mut engine,
        "list_library_variables",
        json!({"group":"Colors/Primary","limit":5}),
    );
    assert_eq!(page["variables"].as_array().unwrap().len(), 5);
    assert!(page["nextOffset"].is_number());
    assert_eq!(engine.state.doc.variables, None, "listing must not import");
}

#[test]
fn batch_design_imports_referenced_library_variables_in_one_undo() {
    let mut engine = DesignEngine::new();
    let before = engine.document_json().unwrap();
    call(
        &mut engine,
        "batch_design",
        json!({"operations": r#"b=I(null, {"type":"frame","name":"Card","width":200,"height":100,"fill":"$--primary-9"})"#}),
    );
    let doc = document(&engine);
    let primary = &doc["variables"]["--primary-9"];
    assert_eq!(primary["value"], "$--purple-9", "{primary}");
    assert!(
        doc["variables"]["--purple-9"].is_object(),
        "alias target imported"
    );
    assert!(doc["variableCollections"]["Theme"]["variables"]["--primary-9"].is_object());
    call(&mut engine, "undo", json!({}));
    assert_eq!(engine.document_json().unwrap(), before);
}

#[test]
fn bind_variable_accepts_a_library_name_before_import() {
    let mut engine = DesignEngine::new();
    call(
        &mut engine,
        "batch_design",
        json!({"operations": r##"b=I(null, {"type":"frame","name":"Card","width":200,"height":100,"fill":"#ffffff"})"##}),
    );
    let id = document(&engine)["children"][0]["id"]
        .as_str()
        .unwrap()
        .to_string();
    call(
        &mut engine,
        "bind_variable",
        json!({"nodeIds":[id],"property":"fill","variable":"--surface-elevation-1"}),
    );
    assert!(document(&engine)["variables"]["--surface-elevation-1"].is_object());
}

#[test]
fn failed_or_read_only_calls_leave_no_imported_variables() {
    let mut engine = DesignEngine::new();
    let before = engine.document_json().unwrap();
    reply(&mut engine, "search_nodes", json!({"query":"--primary-9"}));
    let rejected = reply(
        &mut engine,
        "bind_variable",
        json!({"nodeIds":["missing"],"property":"fill","variable":"--primary-9"}),
    );
    assert_eq!(rejected["isError"], true, "{rejected}");
    assert_eq!(engine.document_json().unwrap(), before);
}

#[test]
fn library_updates_are_reviewed_then_accepted_in_one_undo() {
    let mut engine = DesignEngine::new();
    call(
        &mut engine,
        "import_library_variables",
        json!({"names":["--purple-9"]}),
    );
    let mut doc = document(&engine);
    doc["variables"]["--purple-9"]["value"] = json!("#000000");
    engine.load_document(&doc.to_string()).unwrap();
    let updates = call(&mut engine, "get_library_updates", json!({}));
    assert_eq!(updates["count"], 1, "{updates}");
    assert_eq!(updates["updates"][0]["name"], "--purple-9");
    let edited = engine.document_json().unwrap();
    call(&mut engine, "accept_library_updates", json!({}));
    assert_eq!(
        call(&mut engine, "get_library_updates", json!({}))["count"],
        0
    );
    call(&mut engine, "undo", json!({}));
    assert_eq!(engine.document_json().unwrap(), edited);
}

#[test]
fn apply_design_system_cobalt_imports_the_whole_library_once() {
    let mut engine = DesignEngine::new();
    let applied = call(&mut engine, "apply_design_system", json!({"name":"cobalt"}));
    assert_eq!(applied["count"], 582);
    let doc = document(&engine);
    assert_eq!(
        doc["themes"]["Color scheme (Primitives)"],
        json!(["Light", "Dark"])
    );
    call(&mut engine, "undo", json!({}));
    assert_eq!(engine.state.doc.variables, None);
}

#[test]
fn every_cobalt_token_the_ai_is_taught_exists_in_the_library() {
    let guide = op_ai_skills::style_guide::style_guide_registry()
        .first()
        .expect("style guides embedded");
    assert_eq!(guide.name, "talkdesk-cobalt");
    // Other prompts also document shadcn tokens for preset documents; only
    // their Cobalt lines are checked.
    let cobalt_lines = |text: String| {
        text.lines()
            .filter(|line| line.contains("Cobalt"))
            .collect::<Vec<_>>()
            .join("\n")
    };
    let skill = |name: &str| {
        op_ai_skills::get_skill_by_name(name)
            .unwrap()
            .content
            .clone()
    };
    let mut engine = DesignEngine::new();
    let mut prompt = |name: &str, args: Value, field: &str| {
        let reply: Value =
            serde_json::from_str(&engine.call_tool(name, &args.to_string()).unwrap()).unwrap();
        assert_eq!(reply["isError"], false, "{name}: {reply}");
        reply["structuredContent"][field]
            .as_str()
            .unwrap()
            .to_string()
    };
    let design_prompt = prompt("get_design_prompt", json!({}), "designPrompt");
    let agent_prompt = prompt(
        "get_design_agent_prompt",
        json!({"userMessage":"Design an agent settings page"}),
        "prompt",
    );
    let mut taught = Vec::new();
    for text in [
        guide.content.clone(),
        skill("style-defaults"),
        cobalt_lines(skill("variables")),
        cobalt_lines(design_prompt),
        cobalt_lines(agent_prompt),
    ] {
        let mut rest = text.as_str();
        while let Some(at) = rest.find("$--") {
            let name: String = rest[at + 1..]
                .chars()
                .take_while(|c| c.is_ascii_alphanumeric() || *c == '-')
                .collect();
            rest = &rest[at + 1 + name.len()..];
            taught.push(name);
        }
    }
    assert!(taught.len() > 30, "{taught:?}");
    let library = op_editor_core::variable_library::library("talkdesk-cobalt").unwrap();
    let missing: Vec<_> = taught
        .iter()
        .filter(|n| !library.variables.contains_key(n.as_str()))
        .filter(|n| n.as_str() != "--name")
        .collect();
    assert!(
        missing.is_empty(),
        "taught but not in the library: {missing:?}"
    );
}

#[test]
fn the_cobalt_recipe_builds_a_strictly_valid_document() {
    let mut engine = DesignEngine::new();
    call(
        &mut engine,
        "batch_design",
        json!({"operations": r#"card=I(null, {"type":"frame","name":"Card","width":320,"height":160,"layout":"vertical","gap":"$--spacing-small","padding":"$--spacing-medium","cornerRadius":8,"fill":"$--surface-elevation-1","stroke":{"thickness":1,"fill":[{"type":"solid","color":"$--gray-6"}]}})
title=I(card, {"type":"text","name":"Title","content":"Queue","fontSize":18,"fontWeight":500,"fontFamily":"Roboto","fill":"$--text-default"})
cta=I(card, {"type":"frame","name":"Button","width":120,"height":36,"cornerRadius":500,"fill":"$--primary-9"})"#}),
    );
    let doc = document(&engine);
    let strict: Result<jian_ops_schema::PenDocument, _> = serde_json::from_value(doc.clone());
    assert!(strict.is_ok(), "{:?}", strict.err());
    for name in [
        "--surface-elevation-1",
        "--spacing-small",
        "--spacing-medium",
        "--gray-6",
        "--text-default",
        "--primary-9",
    ] {
        assert!(doc["variables"].get(name).is_some(), "{name} imported");
    }
}

#[test]
fn a_variable_reference_in_a_numeric_only_field_is_rejected() {
    let mut engine = DesignEngine::new();
    let before = engine.document_json().unwrap();
    let result = reply(
        &mut engine,
        "batch_design",
        json!({"operations": r#"b=I(null, {"type":"frame","name":"Bad","width":100,"height":100,"cornerRadius":"$--border-radius-pill"})"#}),
    );
    let doc = document(&engine);
    let strict: Result<jian_ops_schema::PenDocument, _> = serde_json::from_value(doc);
    assert!(
        result["isError"] == true || strict.is_ok(),
        "an invalid reference must not reach the document: {result}"
    );
    if result["isError"] == true {
        assert_eq!(engine.document_json().unwrap(), before);
    }
}
