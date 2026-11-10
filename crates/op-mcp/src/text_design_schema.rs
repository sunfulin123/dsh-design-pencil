//! Input schemas for caller-owned tool catalog/registry integration.
use serde_json::{json, Value};

pub fn text_design_tool_schema(name: &str) -> Option<Value> {
    let mut properties = json!({
        "nodeId":{"type":"string","description":"Text id on the active page; Markdown also accepts a text-only frame."}
    });
    let mut required = vec!["nodeId"];
    match name {
        "set_text_content" => {
            properties["content"] = json!({"type":"string"});
            properties["format"] =
                json!({"type":"string","enum":["plain","markdown"],"default":"plain"});
            properties["options"] = markdown_options();
            required.push("content");
        }
        "set_text_markdown" => {
            properties["markdown"] = json!({
                "type":"string",
                "description":"Headings, paragraphs, nested lists, quotes, fenced code and inline emphasis/links. Produces editable frame/text nodes."
            });
            properties["options"] = markdown_options();
            required.push("markdown");
        }
        "set_text_style" | "get_text_style" => {
            properties["pageId"] = json!({"type":"string","minLength":1,"description":"Optional target page ID; omit for the active page."});
            for key in ["start", "end"] {
                properties[key] = json!({
                    "type":"integer","minimum":0,
                    "description":"Half-open Unicode scalar offset (not UTF-8 bytes or UTF-16). Omit both for the whole text."
                });
            }
            if name == "set_text_style" {
                properties["expectedText"] = json!({"type":"string","description":"Optional full original plain text; reject the edit if the current text differs."});
                properties["style"] = json!({
                    "type":"object","additionalProperties":false,
                    "properties":{
                        "fontFamily":{"type":"string","maxLength":512,"description":"Font family or CSS fallback stack; empty clears the range override."},
                        "fontSize":{"type":"number","exclusiveMinimum":0},
                        "fontWeight":{"type":"integer","minimum":1,"maximum":1000},
                        "fontStyle":{"type":"string","enum":["normal","italic"]},
                        "fill":{"type":"string","description":"Hex color"},
                        "underline":{"type":"boolean"},
                        "strikethrough":{"type":"boolean"},
                        "href":{"type":"string","description":"http(s), mailto, fragment or relative URL; empty clears the link"}
                    }
                });
                required.push("style");
            }
        }
        "set_paragraph_style" => {
            properties["style"] = json!({
                "type":"object","additionalProperties":false,
                "properties":{
                    "lineHeight":{"type":"number","exclusiveMinimum":0,"maximum":4,"description":"Unitless line-height multiplier"},
                    "textAlign":{"type":"string","enum":["left","center","right","justify"]},
                    "indent":{"type":"number","minimum":0},
                    "spaceBefore":{"type":"number","minimum":0},
                    "spaceAfter":{"type":"number","minimum":0},
                    "list":{"type":"string","enum":["none","bullet","ordered"]},
                    "number":{"type":"integer","minimum":1,"default":1}
                },
                "description":"Indentation/spacing in document pixels. Lists use a separate marker column and hanging indentation."
            });
            required.push("style");
        }
        _ => return None,
    }
    Some(
        json!({"type":"object","properties":properties,"required":required,"additionalProperties":false}),
    )
}

fn markdown_options() -> Value {
    json!({
        "type":"object","additionalProperties":false,
        "properties":{
            "width":{"type":"number","exclusiveMinimum":0,"default":400,"description":"Fallback width for text with no authored width"},
            "paragraphSpacing":{"type":"number","minimum":0,"default":8},
            "listIndent":{"type":"number","minimum":0,"default":24}
        }
    })
}
