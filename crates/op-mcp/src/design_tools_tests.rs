use super::*;

fn args(pairs: &[(&str, &str)]) -> BTreeMap<String, String> {
    pairs
        .iter()
        .map(|(k, v)| (k.to_string(), v.to_string()))
        .collect()
}

#[test]
fn parse_id_list_accepts_json_and_csv() {
    let json = parse_id_list(&args(&[("nodeIds", r#"["a","b"]"#)]))
        .ok()
        .unwrap();
    let csv = parse_id_list(&args(&[("node_ids", "a, b,")])).ok().unwrap();
    assert_eq!(json, vec![NodeId::new("a"), NodeId::new("b")]);
    assert_eq!(json, csv);
    assert!(parse_id_list(&args(&[])).ok().unwrap().is_empty());
    assert!(parse_id_list(&args(&[("nodeIds", "[1,")])).is_err());
}

#[test]
fn arrange_nodes_emits_design_command() {
    let outcome = ArrangeNodes.call(&args(&[("mode", "pack_v"), ("nodeIds", "a,b")]));
    let ToolOutcome::OkWithCommand(_, cmd) = outcome else {
        panic!("expected a command");
    };
    assert_eq!(
        cmd,
        EditorCommand::Design(DesignCommand::ArrangeNodes {
            node_ids: vec![NodeId::new("a"), NodeId::new("b")],
            mode: ArrangeMode::PackVertical,
        })
    );
}

#[test]
fn arrange_nodes_validates_arguments() {
    for bad in [
        args(&[]),
        args(&[("mode", "grid")]),
        args(&[("mode", "tidy"), ("nodeIds", "only")]),
    ] {
        assert!(matches!(ArrangeNodes.call(&bad), ToolOutcome::Err(..)));
    }
    // No ids → selection fallback, resolved at apply time.
    assert!(matches!(
        ArrangeNodes.call(&args(&[("mode", "tidy")])),
        ToolOutcome::OkWithCommand(..)
    ));
}
