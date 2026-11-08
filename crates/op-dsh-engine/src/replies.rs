use serde_json::{json, Value};
use wasm_bindgen::JsValue;

pub(super) fn ok_reply(value: Value) -> String {
    json!({
        "isError": false,
        "content": [{ "type": "text", "text": value.to_string() }],
        "structuredContent": value,
    })
    .to_string()
}

pub(super) fn error_reply(message: &str) -> String {
    json!({ "isError": true, "content": [{ "type": "text", "text": message }] }).to_string()
}

pub(super) fn js_error(error: impl std::fmt::Display) -> JsValue {
    JsValue::from_str(&error.to_string())
}
