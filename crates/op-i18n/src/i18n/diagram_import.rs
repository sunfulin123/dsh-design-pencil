//! Diagram import strings shared by the browser menu and error notice.
pub fn lookup(key: &str, chinese: bool) -> Option<&'static str> {
    let (en, zh) = match key {
        "diagram.import" => ("Import Mermaid / draw.io…", "导入 Mermaid / draw.io…"),
        "diagram.importFailed" => (
            "Diagram import failed: {{message}}",
            "图表导入失败：{{message}}",
        ),
        _ => return None,
    };
    Some(if chinese { zh } else { en })
}
