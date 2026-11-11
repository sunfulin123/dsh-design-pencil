//! Embedded design guidance shared by MCP and host adapters.

pub const VERSION: &str = "synapse-design/1";
pub const SKILL: &str = include_str!("../skills/synapse-design/SKILL.md");
pub const HTML_POC: &str = include_str!("../skills/synapse-design-html/SKILL.md");
const DIRECTION: &str = include_str!("../skills/synapse-design/direction.md");
const COMPOSITION: &str = include_str!("../skills/synapse-design/composition.md");
const REVIEW: &str = include_str!("../skills/synapse-design/review.md");

pub fn resource(id: &str) -> Option<&'static str> {
    match id {
        "op-design" => Some(SKILL),
        "op-design-direction" => Some(DIRECTION),
        "op-design-composition" => Some(COMPOSITION),
        "op-design-review" => Some(REVIEW),
        "html-poc" => Some(HTML_POC),
        _ => None,
    }
}

pub fn prompt(mode: &str, screenshots: bool) -> Option<String> {
    let focus = match mode {
        "bootstrap" => "Read the three-layer context funnel before requesting a style decision.",
        "local" => "This is a local edit: preserve the existing design and do not request a style.",
        "full" => "For a new design, resolve the user's style before creating styled content.",
        _ => return None,
    };
    let verify = if screenshots {
        "Use a real CanvasKit screenshot and report its actual result."
    } else {
        "This host cannot render screenshots; report visual verification as unavailable and use layout checks."
    };
    Some(format!("{SKILL}\n\n## Current task\n\n{focus}\n{verify}"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn skill_is_op_focused_and_resources_are_addressable() {
        let skill = resource("op-design").unwrap();
        assert!(skill.contains("three-layer context funnel"));
        assert!(skill.contains("preselected recommendation is not consent"));
        assert!(skill.contains("at most three corrective rounds"));
        assert!(skill.contains("rather than inserting a second page root"));
        assert!(resource("op-design-review").unwrap().contains("screenshot"));
        for guidance in [skill, resource("op-design-review").unwrap()] {
            assert!(guidance.contains("synapse_design_pipeline_context"));
            assert!(guidance.contains("value.nextCursor"));
        }
        assert!(resource("../../secret").is_none());
        assert!(!skill.contains("Three.js"));
        assert!(!skill.contains("DOM"));
    }
}
