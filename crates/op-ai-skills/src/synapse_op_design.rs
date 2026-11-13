//! Embedded design guidance shared by MCP and host adapters.
//!
//! The skill itself is the small core. Each stage of a design task gets only
//! the guidance that stage needs, so the same rules are not delivered again
//! with every tool result.

pub const VERSION: &str = "synapse-design/3";
pub const SKILL: &str = include_str!("../skills/synapse-design/SKILL.md");
pub const HTML_POC: &str = include_str!("../skills/synapse-design-html/SKILL.md");
const BUILD: &str = include_str!("../skills/synapse-design/build.md");
const DIRECTION: &str = include_str!("../skills/synapse-design/direction.md");
const COMPOSITION: &str = include_str!("../skills/synapse-design/composition.md");
const REVIEW: &str = include_str!("../skills/synapse-design/review.md");
const CRAFT: &str = include_str!("../skills/synapse-design/craft.md");
const FEEDBACK: &str = include_str!("../skills/synapse-design/feedback.md");
const JUDGEMENT: &str = include_str!("../skills/synapse-design-html/references/judgement.md");
/// Start of the acceptance half of the judgement guide (quality floor,
/// evidence and rubric); everything before it is planning judgement.
const ACCEPTANCE_HEADING: &str = "## 5. Non-Negotiable Quality Floor";

/// Addressable guidance sections, in the order hosts should list them.
pub const RESOURCES: &[&str] = &[
    "op-design",
    "op-design-build",
    "op-design-direction",
    "op-design-composition",
    "op-design-review",
    "op-design-judgement",
    "op-design-craft",
    "op-design-feedback",
];

/// Stage-scoped prompt modes accepted by [`prompt`] besides the legacy
/// `bootstrap`, `local` and `full`.
pub const STAGE_MODES: &[&str] = &["plan", "build", "review", "revise", "deliver"];

pub fn resource(id: &str) -> Option<&'static str> {
    match id {
        "op-design" => Some(SKILL),
        "op-design-build" => Some(BUILD),
        "op-design-direction" => Some(DIRECTION),
        "op-design-composition" => Some(COMPOSITION),
        "op-design-review" => Some(REVIEW),
        "op-design-judgement" => Some(JUDGEMENT),
        "op-design-craft" => Some(CRAFT),
        "op-design-feedback" => Some(FEEDBACK),
        "html-poc" => Some(HTML_POC),
        _ => None,
    }
}

/// The acceptance half of the judgement guide: what blocks delivery and what
/// counts as evidence.
fn acceptance() -> &'static str {
    JUDGEMENT
        .find(ACCEPTANCE_HEADING)
        .map_or(JUDGEMENT, |start| &JUDGEMENT[start..])
}

pub fn prompt(mode: &str, screenshots: bool) -> Option<String> {
    let verify = if screenshots {
        "Use a real CanvasKit screenshot and report its actual result."
    } else {
        "This host cannot render screenshots; report visual verification as unavailable and use layout checks."
    };
    let (guidance, focus): (Vec<&str>, &str) = match mode {
        "bootstrap" => (
            vec![SKILL],
            "Read the three-layer context funnel before requesting a style decision.",
        ),
        "local" => (
            vec![SKILL],
            "This is a local edit: preserve the existing design and do not request a style.",
        ),
        "full" => (
            vec![SKILL, BUILD, JUDGEMENT],
            "For a new design, resolve the user's style before creating styled content.",
        ),
        "plan" => (
            vec![JUDGEMENT],
            "Planning stage: state the user, task and success criterion, then decide structure and the three levels of space before any styling.",
        ),
        "build" => (
            vec![BUILD],
            "Build stage: after each region, confirm its planned content is present and visible before adjusting spacing. Load op-design-craft for a specific craft question.",
        ),
        "review" => (
            vec![REVIEW, acceptance()],
            "Review stage: confirm content completeness first, then review at three scales on the real render. Report each check as it was actually performed.",
        ),
        "revise" => (
            vec![FEEDBACK],
            "Revision stage: locate the defect in the current render, fix its cause, look for the same problem elsewhere, then re-check the affected scope.",
        ),
        "deliver" => (
            vec![acceptance()],
            "Delivery stage: evidence must describe the final version. Report passed, failed and unverified checks separately.",
        ),
        _ => return None,
    };
    Some(format!(
        "{}\n\n## Current task\n\n{focus}\n{verify}",
        guidance.join("\n\n")
    ))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn skill_is_op_focused_and_resources_are_addressable() {
        assert_eq!(VERSION, "synapse-design/3");
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
        assert!(build.contains("English by default"));
        assert!(skill.contains("in English"));
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
        assert!(resource("op-design-craft")
            .unwrap()
            .contains("fontResolution"));
        assert!(resource("op-design-feedback")
            .unwrap()
            .contains("the first diagnosis was wrong"));
        for id in RESOURCES {
            assert!(resource(id).is_some(), "unresolvable resource {id}");
        }
        let html = resource("html-poc").unwrap();
        assert!(html.contains("version: synapse-design-html/3"));
        assert!(html.contains("Stage A"));
        assert!(html.contains("judgement.md"));
        assert!(resource("../../secret").is_none());
        assert!(!skill.contains("Three.js"));
        assert!(!skill.contains("DOM"));
    }

    #[test]
    fn judgement_carries_the_evidence_rules_and_the_observed_spacing_cases() {
        let judgement = resource("op-design-judgement").unwrap();
        for required in [
            "Three levels of space",
            "Sibling groups share one heading indent",
            "keep a clear inset from the edge of their container",
            "never treat the gap it leaves as whitespace",
            "`unverified`",
            "A screenshot was produced ≠ it was inspected",
            "a sentence in the handover is not consent",
            "it is not a successful verification of that feature",
            "per-line centring measurement",
        ] {
            assert!(judgement.contains(required), "judgement lost: {required}");
        }
        assert!(JUDGEMENT.contains(ACCEPTANCE_HEADING));
        assert!(acceptance().starts_with(ACCEPTANCE_HEADING));
        assert!(!acceptance().contains("Surface Mode Selection"));
    }

    #[test]
    fn each_stage_receives_only_its_own_guidance() {
        let skill = resource("op-design").unwrap();
        for mode in STAGE_MODES {
            let staged = prompt(mode, true).unwrap_or_else(|| panic!("missing stage {mode}"));
            assert!(
                !staged.contains("## Host Tool Mapping"),
                "{mode} repeats the skill, which the host already loaded"
            );
            assert!(staged.len() < prompt("full", true).unwrap().len());
        }
        let plan = prompt("plan", true).unwrap();
        assert!(plan.contains("Surface Mode Selection"));
        assert!(!plan.contains("OP Engine Build Guide"));
        let build = prompt("build", true).unwrap();
        assert!(build.contains("OP Engine Build Guide"));
        assert!(!build.contains("Surface Mode Selection"));
        let review = prompt("review", true).unwrap();
        assert!(review.contains("Completeness before appearance"));
        assert!(review.contains(ACCEPTANCE_HEADING));
        assert!(!review.contains("Surface Mode Selection"));
        assert!(prompt("revise", true)
            .unwrap()
            .contains("Look for the same problem elsewhere"));
        assert!(prompt("deliver", false)
            .unwrap()
            .contains("Version binding"));
        assert!(prompt("ship", true).is_none());
        for needle in [
            "Guidance by Stage",
            "review.checks",
            "review.actions",
            "synapse-design-deviation:",
            "op-design-feedback",
        ] {
            assert!(skill.contains(needle), "skill lost: {needle}");
        }
    }
}
