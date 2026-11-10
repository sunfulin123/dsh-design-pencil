use serde_json::{json, Value};

pub fn schemas() -> Vec<Value> {
    let mut result = Vec::new();
    for (name, description, properties, required) in [
        (
            "get_design_capabilities",
            "Return the live tool schemas and managed-host access classifications.",
            json!({}),
            json!([]),
        ),
        (
            "plan_design_canvas",
            "Plan a neutral editable canvas from the user's stated device or dimensions.",
            json!({"userMessage":{"type":"string","minLength":1},"context":{"type":"string"}}),
            json!(["userMessage"]),
        ),
        (
            "plan_design_style",
            "Resolve style selection from the actual user request and document context; list current catalogue choices without changing a document.",
            json!({"userMessage":{"type":"string","minLength":1},"taskKind":{"type":"string","enum":["new","continue","local","restyle"]},"documentStyleId":{"type":"string","minLength":1},"documentHasStyle":{"type":"boolean"},"offset":{"type":"integer","minimum":0},"limit":{"type":"integer","minimum":1,"maximum":100},"query":{"type":"string"},"locale":{"type":"string","enum":["zh","en"]}}),
            json!(["userMessage","taskKind"]),
        ),
        (
            "import_design_md",
            "Import raw Markdown into the style library (default) or document specification.",
            json!({"markdown":{"type":"string","minLength":1},"name":{"type":"string"},"target":{"type":"string","enum":["style-guide","document"]},"id":{"type":"string"},"expectedRevision":{"type":"integer","minimum":0}}),
            json!(["markdown"]),
        ),
        (
            "list_theme_presets",
            "List bundled design systems and persistent user theme presets.",
            json!({"source":{"type":"string","enum":["builtin","user"]},"query":{"type":"string"},"offset":{"type":"integer","minimum":0},"limit":{"type":"integer","minimum":1,"maximum":100}}),
            json!([]),
        ),
        (
            "get_theme_preset",
            "Read a reusable theme preset as compatible .optheme JSON.",
            json!({"id":{"type":"string","minLength":1}}),
            json!(["id"]),
        ),
        (
            "save_theme_preset",
            "Persist the current document theme axes and variables.",
            json!({"name":{"type":"string","minLength":1},"id":{"type":"string"},"expectedRevision":{"type":"integer","minimum":0}}),
            json!(["name"]),
        ),
        (
            "import_theme_preset",
            "Validate and persist .optheme JSON without reading host paths.",
            json!({"preset":{"type":"object"},"id":{"type":"string"},"expectedRevision":{"type":"integer","minimum":0}}),
            json!(["preset"]),
        ),
        (
            "export_theme_preset",
            "Export a preset without normalizing away unknown file fields.",
            json!({"id":{"type":"string","minLength":1}}),
            json!(["id"]),
        ),
        (
            "load_theme_preset",
            "Merge theme axes and variables into the document in one undo.",
            json!({"id":{"type":"string","minLength":1}}),
            json!(["id"]),
        ),
        (
            "get_editor_theme",
            "Read effective theme, device preference and host override from the connected editor.",
            json!({}),
            json!([]),
        ),
        (
            "set_editor_theme",
            "Set the connected editor theme after acknowledgement; persist is opt-in.",
            json!({"theme":{"type":"string","enum":["light","dark"]},"persist":{"type":"boolean"}}),
            json!(["theme"]),
        ),
    ] {
        result.push(schema(name, description, properties, required));
    }
    for suffix in ["style_guide", "theme_preset"] {
        for verb in ["rename", "delete"] {
            let mut properties = json!({"id":{"type":"string","minLength":1},"expectedRevision":{"type":"integer","minimum":0}});
            let mut required = json!(["id", "expectedRevision"]);
            if verb == "rename" {
                properties["name"] = json!({"type":"string","minLength":1});
                required.as_array_mut().unwrap().push(json!("name"));
            }
            result.push(schema(&format!("{verb}_{suffix}"),
                "Manage a persistent user asset; builtins are read-only and stale revisions are rejected.",
                properties, required));
        }
    }
    result
}

fn schema(name: &str, description: &str, properties: Value, required: Value) -> Value {
    json!({"name":name,"description":description,"inputSchema":{
        "type":"object","properties":properties,"required":required,"additionalProperties":false}})
}

pub fn is_host_tool(name: &str) -> bool {
    static NAMES: std::sync::OnceLock<std::collections::BTreeSet<String>> =
        std::sync::OnceLock::new();
    NAMES
        .get_or_init(|| {
            schemas()
                .iter()
                .filter_map(|s| s["name"].as_str().map(str::to_owned))
                .collect()
        })
        .contains(name)
}
