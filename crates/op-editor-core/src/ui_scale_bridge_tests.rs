use crate::bridge_protocol::{event_ui_scale, BridgeInbound};
use crate::editor_ui_state::ui_scale::UiScale;

#[test]
fn ui_scale_bridge_accepts_only_strict_supported_percentages() {
    for scale in [100, 110, 125, 150] {
        let message =
            format!(r#"{{"type":"op-bridge/set-ui-scale","requestId":"s","scale":{scale}}}"#);
        assert!(matches!(
            BridgeInbound::parse(&message),
            Some(BridgeInbound::SetUiScale { .. })
        ));
    }
    for scale in ["120", "200", "\"125\"", "125.0", "null"] {
        let message =
            format!(r#"{{"type":"op-bridge/set-ui-scale","requestId":"s","scale":{scale}}}"#);
        assert_eq!(BridgeInbound::parse(&message), None);
    }
    assert_eq!(
        BridgeInbound::parse(r#"{"type":"op-bridge/get-ui-scale","requestId":"s"}"#),
        Some(BridgeInbound::GetUiScale {
            request_id: "s".into()
        })
    );
    assert_eq!(
        BridgeInbound::parse(r#"{"type":"op-bridge/get-ui-scale","requestId":"s","extra":true}"#),
        None
    );
    assert_eq!(
        BridgeInbound::parse(
            r#"{"type":"op-bridge/set-ui-scale","requestId":"s","scale":125,"extra":true}"#
        ),
        None
    );
    let reply: serde_json::Value =
        serde_json::from_str(&event_ui_scale("s", UiScale::Percent125)).unwrap();
    assert_eq!(reply["type"], "op-bridge/ui-scale-result");
    assert_eq!(reply["requestId"], "s");
    assert_eq!(reply["scale"], 125);
    assert_eq!(
        reply["supportedScales"],
        serde_json::json!([100, 110, 125, 150])
    );
}
