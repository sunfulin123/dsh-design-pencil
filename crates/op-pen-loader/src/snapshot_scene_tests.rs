use op_editor_core::EditorState;

use crate::editor_state_to_layout_scene;

#[test]
fn snapshot_absolute_overflow_does_not_expand_fixed_parent() {
    let snapshot = r##"{
      "version":1,
      "title":"Overflow snapshot",
      "viewport":{"width":320,"height":240},
      "root":{
        "kind":"element","tag":"body",
        "rect":{"x":0,"y":0,"w":100,"h":100},
        "styles":{"overflow":"visible"},
        "children":[{
          "kind":"element","tag":"div",
          "rect":{"x":80,"y":70,"w":50,"h":60},
          "styles":{"background-color":"#ff0000"},
          "children":[]
        }]
      }
    }"##;
    let imported = op_html::import_snapshot_document(
        snapshot,
        &op_html::HtmlImportOptions {
            viewport_width: 320.0,
            ..Default::default()
        },
    );
    assert!(imported.warnings.is_empty(), "{:?}", imported.warnings);

    let state = EditorState::from_document(imported.document);
    let scene = editor_state_to_layout_scene(&state);
    let root = &scene.active_page().expect("active page").children[0];
    let overflow = &root.children[0];

    assert_eq!((root.bounds.size.x, root.bounds.size.y), (100.0, 100.0));
    assert_eq!(
        (
            overflow.bounds.origin.x,
            overflow.bounds.origin.y,
            overflow.bounds.size.x,
            overflow.bounds.size.y,
        ),
        (80.0, 70.0, 50.0, 60.0)
    );
}

#[test]
fn snapshot_text_nodes_preserve_min_width_and_min_height_in_authored_geometry() {
    let snapshot = r##"{
      "version":1,
      "title":"Text bounds snapshot",
      "viewport":{"width":640,"height":320},
      "root":{
        "kind":"element","tag":"body",
        "rect":{"x":0,"y":0,"w":640,"h":320},
        "styles":{"background-color":"#f5f5f0"},
        "children":[
          {
            "kind":"text",
            "text":"Grade-5 titanium",
            "lines":1,
            "rect":{"x":116,"y":181,"w":412,"h":57},
            "styles":{"font-size":"48px","line-height":"57px","color":"#1c1c1a"}
          },
          {
            "kind":"text",
            "text":"Machined from aerospace-grade Grade-5 titanium with a matte finish.",
            "lines":3,
            "rect":{"x":116,"y":252,"w":380,"h":72},
            "styles":{"font-size":"16px","line-height":"24px","color":"#575652"}
          }
        ]
      }
    }"##;
    let imported = op_html::import_snapshot_document(
        snapshot,
        &op_html::HtmlImportOptions {
            viewport_width: 640.0,
            ..Default::default()
        },
    );
    assert!(imported.warnings.is_empty(), "{:?}", imported.warnings);

    let mut state = EditorState::from_document(imported.document);
    state.editor_ui.preserve_authored_geometry = true;
    let scene = editor_state_to_layout_scene(&state);
    let root = &scene.active_page().expect("active page").children[0];
    let heading = root
        .children
        .iter()
        .find(|n| n.text.as_deref() == Some("Grade-5 titanium"))
        .expect("heading node");
    let paragraph = root
        .children
        .iter()
        .find(|n| {
            n.text
                .as_deref()
                .is_some_and(|t| t.starts_with("Machined from"))
        })
        .expect("paragraph node");

    assert_eq!(
        (
            heading.bounds.origin.x,
            heading.bounds.origin.y,
            heading.bounds.size.x,
            heading.bounds.size.y,
        ),
        (116.0, 181.0, 412.0, 57.0),
        "single-line snapshot text must preserve min_width as scene bounds.size.x"
    );
    assert_eq!(
        (
            paragraph.bounds.origin.x,
            paragraph.bounds.origin.y,
            paragraph.bounds.size.x,
            paragraph.bounds.size.y,
        ),
        (116.0, 252.0, 380.0, 72.0),
        "multi-line snapshot text must preserve min_height as scene bounds.size.y"
    );
}
