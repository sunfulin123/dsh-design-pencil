//! Compile the automatically discovered design-data catalogue without embedding reference images.
use std::{env, path::PathBuf, process::Command};
fn main() {
    println!("cargo:rerun-if-changed=skills");
    let root = PathBuf::from(env::var("CARGO_MANIFEST_DIR").unwrap()).join("../..");
    let source = root.join("packages/design-data");
    let out = PathBuf::from(env::var("OUT_DIR").unwrap()).join("style-guides");
    println!("cargo:rerun-if-changed={}", source.display());
    let output = Command::new("node")
        .arg(source.join("tools/catalog.mjs"))
        .arg(&out)
        .output()
        .expect("design-data catalogue generation requires Node.js (see COMMANDS.md)");
    assert!(
        output.status.success(),
        "design-data catalogue generation failed: {}",
        String::from_utf8_lossy(&output.stderr)
    );
    let count: usize = String::from_utf8(output.stdout)
        .unwrap()
        .trim()
        .parse()
        .expect("catalogue count");
    std::fs::write(
        out.parent().unwrap().join("style-count.rs"),
        count.to_string(),
    )
    .unwrap();
    println!("cargo:rustc-env=DESIGN_DATA_EMBED_DIR={}", out.display());
}
