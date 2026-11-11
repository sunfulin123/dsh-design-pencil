//! Embedded design guidance shared by MCP and host adapters.

pub const VERSION: &str = "synapse-design/2";
pub const SKILL: &str = include_str!("../skills/synapse-design/SKILL.md");
pub const HTML_POC: &str = include_str!("../skills/synapse-design-html/SKILL.md");
const BUILD: &str = include_str!("../skills/synapse-design/build.md");
const DIRECTION: &str = include_str!("../skills/synapse-design/direction.md");
const COMPOSITION: &str = include_str!("../skills/synapse-design/composition.md");
const REVIEW: &str = include_str!("../skills/synapse-design/review.md");
const JUDGEMENT: &str = include_str!("../skills/synapse-design-html/references/judgement.md");

pub fn resource(id: &str) -> Option<&'static str> {
    match id {
        "op-design" => Some(SKILL),
        "op-design-build" => Some(BUILD),
        "op-design-direction" => Some(DIRECTION),
        "op-design-composition" => Some(COMPOSITION),
        "op-design-review" => Some(REVIEW),
        "op-design-judgement" => Some(JUDGEMENT),
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
    if mode == "full" {
        Some(format!(
            "{SKILL}\n\n{BUILD}\n\n{JUDGEMENT}\n\n## Current task\n\n{focus}\n{verify}"
        ))
    } else {
        Some(format!("{SKILL}\n\n## Current task\n\n{focus}\n{verify}"))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn skill_is_op_focused_and_resources_are_addressable() {
        assert_eq!(VERSION, "synapse-design/2");
        let skill = resource("op-design").unwrap();
        assert!(skill.contains("three-layer context funnel"));
        assert!(skill.contains("preselected recommendation is not consent"));
        assert!(skill.contains("at most three corrective rounds"));
        assert!(skill.contains("rather than inserting a second page root"));
        for stage in [
            "Stage A", "Stage B", "Stage C", "Stage D", "Stage E", "Stage F", "Stage G",
        ] {
            assert!(skill.contains(stage), "missing {stage} in SKILL.md");
        }
        let build = resource("op-design-build").expect("build resource must resolve");
        assert!(build.contains("fit_content"));
        assert!(build.contains("textGrowth"));
        assert!(build.contains("Noto Sans SC"));
        assert!(!build.contains("#F8FAFC"));
        let judgement =
            resource("op-design-judgement").expect("shared judgement resource must resolve");
        assert!(judgement.contains("Operate"));
        assert!(judgement.contains("Non-Negotiable Quality Floor"));
        assert!(!judgement.contains("oklch("));
        assert!(resource("op-design-review").unwrap().contains("screenshot"));
        for guidance in [skill, resource("op-design-review").unwrap()] {
            assert!(guidance.contains("synapse_design_pipeline_context"));
            assert!(guidance.contains("value.nextCursor"));
        }
        let full = prompt("full", true).unwrap();
        assert!(full.contains(build));
        assert!(full.contains(judgement));
        let local = prompt("local", true).unwrap();
        assert!(!local.contains("Non-Negotiable Quality Floor"));
        let html = resource("html-poc").unwrap();
        assert!(html.contains("version: synapse-design-html/2"));
        assert!(html.contains("Stage A"));
        assert!(html.contains("judgement.md"));
        assert!(resource("../../secret").is_none());
        assert!(!skill.contains("Three.js"));
        assert!(!skill.contains("DOM"));
    }
}
