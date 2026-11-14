# Audit

## Guidance

:::note
Sourced from Cobalt's live Accessibility docs, which the Cobalt team has flagged as under review —
treat as a starting point, not settled guidance.
:::

The audit process will require accessibility knowledge such as performing automated testing, operating
only using the keyboard, testing with assistive technologies, and creating the ACR, among other
examples, so, before starting, we highly recommend taking the accessibility courses previously listed.
This process has as a result an Accessibility Audit Report that identifies all accessibility issues.
After fixing all issues identified in the Accessibility Audit Report, an Accessibility Conformance
Report (ACR) should also be created.

## Methods

The audit process combines three different testing methods: automated testing, manual testing and
assistive technology (AT) testing.

Automated testing can only identify less than 30% of accessibility violations, so we must perform
manual and AT testing. Ideally, manual and AT testing should only start when no issues are already
identified by automated testing, however, because some important issues are only identified by manual
and AT evaluation and solving all issues identified by automated testing can take significant time, we
also recommend performing manual and AT testing after automated testing.

### Automated testing

We recommend testing with as many automated tools as possible because different tools provide
different, complementary results.

**Mandatory:**

* IBM Equal Access Accessibility Checker

To perform an automated test using the IBM Equal Access Accessibility Checker, first install the
browser extension and then follow these steps:

1. Enter the webpage you want to test
2. Right-click on the page and select Inspect
3. Choose "IBM Equal Access Accessibility Checker" tab
4. Select the "Scan" button
5. After the scan, choose "Download current scan" by selecting the dropdown on the left of the "Scan"
   button
6. Add the report insights to the Accessibility audit report

**Important:**

* Lighthouse
* axe DevTools - Web Accessibility Testing
* webhint
* LERA
* ANDI - Accessibility Testing Tool
* WAVE Evaluation Tool
* Accessibility Insights for Web

**Color contrast and color blindness tools:**

* Are My Colours Accessible
* Adobe Color
* Color Contrast Checker - TPGi
* Leonardo
* Accessibility features reference - Chrome Developers

Other tools: Web Accessibility Evaluation Tools List, Section508.gov web software.

### Manual testing

To perform manual testing you should follow at least the first provided checklist, IBM Accessibility,
Verify - manual checklist. We encourage you to also follow the other checklists and add new topics that
are not covered by the provided checklist but that you identified as important from a training course,
to answer a user request, and/or to improve a specific product use case's accessibility.

* IBM Accessibility — Verify - manual checklist
* LearnAccessibility! — Checkpoints for navigation and wayfinding
* University of Washington — Accessibility checklist
* Microsoft — Accessibility checklist
* The A11Y project — Accessibility checklist
* Section 508 ICT Testing Baseline — ICT Testing Baseline for Web Accessibility

### Assistive technology testing

The assistive technology testing will be focused on testing using one of the following screen readers:
NVDA, JAWS, VoiceOver, Narrator, TalkBack, Orca.

Before starting the AT testing it is essential to complete the recommended training, which instructs
how to test with a screen reader. Additionally, it is highly recommended to attend the University of
Washington webinar, *Testing with Screen Readers, April 2023 Edition*.

To perform this test you should follow the provided checklist using a screen reader. We encourage you
to add new topics that are not covered by the provided checklist but that you identified as important
from a training course, to answer a user request, and/or to improve a specific product use case's
accessibility.

* IBM Accessibility — Test with a screen reader checklist

## Accessibility audit report template

Use this template to add insights from automated, manual and AT testing. The template shows a table
composed of the following columns:

| Column                   | Description                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Method                   | The method used: Automated testing (IBM Equal Access Accessibility Checker, Lighthouse, axe DevTools, webhint, LERA, ANDI, WAVE, Accessibility Insights for Web), Manual testing, or Assistive technology testing.                                                                                                                                                                                      |
| Product                  | The product where the issue was identified.                                                                                                                                                                                                                                                                                                                                                             |
| Screenshot               | Screenshot(s) related to the issue.                                                                                                                                                                                                                                                                                                                                                                     |
| Link                     | The link where the issue was identified.                                                                                                                                                                                                                                                                                                                                                                |
| Criteria                 | The related WCAG criteria.                                                                                                                                                                                                                                                                                                                                                                              |
| Conformance Level        | The provided criteria's conformance level: A, AA or AAA.                                                                                                                                                                                                                                                                                                                                                |
| Rule                     | The WCAG rule(s) related to the provided criteria.                                                                                                                                                                                                                                                                                                                                                      |
| Issue                    | A description of the identified issue.                                                                                                                                                                                                                                                                                                                                                                  |
| Code                     | The code related to the issue that must be fixed.                                                                                                                                                                                                                                                                                                                                                       |
| Technique(s)             | The WCAG technique(s), related to the provided criteria, that should be adopted.                                                                                                                                                                                                                                                                                                                        |
| Recommendations          | Recommendations and resources on how to fix the issue.                                                                                                                                                                                                                                                                                                                                                  |
| Remarks and Explanations | From the international edition of VPAT®, this section may include: information regarding the testing of a given criteria, information on application dependencies to support accessibility (e.g. OS, app frameworks, browsers recommended), how the customer can find more information about accessibility issues (e.g. a bug ID for customer support), and known workarounds for accessibility issues. |
| Jira ticket              | The Jira ticket related to this fix.                                                                                                                                                                                                                                                                                                                                                                    |

## Additional recommendations

A product without any accessibility issue identified by automated or manual testing is not necessarily
accessible by all users.

Accessibility is an on-going process and your users may have specific accessibility needs that should
be answered. It is important to continuously research accessibility opportunities to guarantee that
your product answers all your users' accessibility needs. To find new accessibility opportunities we
suggest:

* Testing with users with disabilities
* Testing with users with disabilities that use assistive technologies
* Performing automated or manual testing as new developments are launched
* Following analytics metrics and KPIs
* Requesting evaluation reports from accessibility experts

:::note
The live source page linked most tool/checklist names and listed several accessibility-consultancy
URLs directly; this migration kept the names as plain text since the transcription method used
couldn't reliably capture link targets. Re-add the actual URLs when this page gets a proper editorial
pass.
:::
