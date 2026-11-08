//! [`DesignCommand`] — design operations ported from open-pencil, kept as
//! one nested family so the capped `EditorCommand` / `apply` spines grow
//! by a single arm. Document mutations participate in history; transient
//! clipboard operations are explicitly excluded from batches.

use crate::arrange::ArrangeMode;
use crate::node_id::NodeId;
use crate::state::EditorState;

#[derive(Debug, Clone, PartialEq)]
pub enum DesignCommand {
    VariableModes {
        scope: crate::design_bindings::VariableModeScope,
        modes: std::collections::BTreeMap<String, String>,
    },
    SharedStyle {
        operation: crate::shared_styles::SharedStyleOperation,
    },
    CopyProperties {
        properties: std::collections::BTreeMap<String, serde_json::Value>,
    },
    /// Tidy Up / Pack the given sibling nodes (the selection when
    /// `node_ids` is empty).
    ArrangeNodes {
        node_ids: Vec<NodeId>,
        mode: ArrangeMode,
    },
}

impl EditorState {
    /// Apply one [`DesignCommand`]; `true` when the document changed.
    /// Each mutator pushes its own history on real change and records a
    /// reason in `ui.design_reject` when it refuses.
    pub(crate) fn apply_design_command(&mut self, cmd: DesignCommand) -> bool {
        self.ui.design_reject = None;
        match cmd {
            DesignCommand::VariableModes { scope, modes } => {
                match crate::design_bindings::apply_scope_modes(self, scope, modes) {
                    Ok(changed) => changed,
                    Err(err) => {
                        self.ui.design_reject = Some(err.to_string());
                        false
                    }
                }
            }
            DesignCommand::SharedStyle { operation } => {
                match crate::shared_styles::apply_shared_style(self, operation) {
                    Ok(changed) => changed,
                    Err(err) => {
                        self.ui.design_reject = Some(err.to_string());
                        false
                    }
                }
            }
            DesignCommand::CopyProperties { properties } => {
                self.ui.appearance_clipboard = Some(properties);
                true
            }
            DesignCommand::ArrangeNodes { node_ids, mode } => self.arrange_nodes(&node_ids, mode),
        }
    }
}
