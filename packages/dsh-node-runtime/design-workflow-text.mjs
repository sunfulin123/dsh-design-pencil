/**
 * Model-facing text for the Synapse design workflow tools.
 *
 * The design runtime owns what the model is told: tool descriptions, parameter
 * descriptions and the `next` instruction returned at each step. A host adapter
 * registers tools and enforces session, sandbox and storage rules; it reads its
 * wording from here, so the guidance, the gates and the skill cannot drift
 * apart between repositories.
 *
 * Each `next` carries only what the current step needs. The full guidance is
 * the skill, loaded once by the host.
 */

import { ACTION_KINDS, CHECK_STATUSES } from './draft-review-checks.mjs';

export const WORKFLOW_TEXT_VERSION = 1;

const CONTENT_STATE_LIST = '["loading", "empty", "error", "partial", "success", "permission"]';
const HOST_FAILURE = 'Stop and report this host failure once. Do not retry finish, inspect/context-read, guess a repair, abort, or rebuild another draft.';

export const TOOL_TEXT = {
  discovery: {
    description: 'Ask the design runtime whether a user-confirmed style is needed; render its live catalog when it is.',
    parameters: {
      brief: 'The current design request.',
      discovery: 'The request handle.',
      taskId: 'Task id returned when context collection is needed.',
      contextSummary:
        'Substantive (>= 40 chars) user-visible summary of understood requirements after reading relevant context: who the user is, the task they complete, and what counts as success.',
      sourceReferences: 'Relevant conversation, project, or document sources actually consulted.',
      openQuestions: 'Material unanswered questions; ask the user before proceeding.',
      screens: `Planned screens ({ name, states? } where name is in English unless another UI language was explicitly requested, and states are optional values from ${CONTENT_STATE_LIST}); required and non-empty once openQuestions is empty.`,
      route: 'Explicit user-stated workflow route ("html" for HTML POC first, "synapse" for direct high-fidelity canvas); omit unless explicitly chosen by the user.',
      platform: 'Target viewport family ("web" or "mobile").',
      canvasWidth: 'Optional explicit root canvas width in pixels (240..3840).',
      canvasHeight: 'Optional explicit root canvas height in pixels (240..20000).',
      styleMode:
        'Structured style selection mode ("ask_user" default, "explicit" with styleId, "default" when style is explicitly delegated, "reselect" to reopen gallery).',
      styleId: 'Catalogue style ID, name, or candidate code when styleMode="explicit".',
      newTask: 'True when starting a brand-new design task in a session that already finished a prior design.',
    },
  },
  begin: {
    description: 'Start a private design draft after the runtime confirms the style decision. The workspace file is created only after successful finish.',
    parameters: {
      path: 'Optional new workspace-relative or absolute .op target. Omit it unless the user explicitly named a file; the plugin creates a concrete collision-resistant filename. An explicit target must not exist and is preserved exactly.',
      brief: "The user's design request.",
      engine: 'Use the design runtime through DSH tools.',
      discovery: 'Optional handle returned by synapse_design_discovery after an explicitly requested guided selection.',
    },
  },
  batch: {
    description: 'Apply a sandboxed design script to the private draft through the current design runtime. Write all authored UI text inside the design in English unless the user explicitly requested another target UI language.',
  },
  context: {
    description:
      'Read and modify native design context for an unpublished OpenPencil pipeline draft, including variables, text, shared styles, components, prototype interactions, checks and undo. filesystem paths, URLs, imports, exports, and spawned agents are forbidden.',
    parameters: {
      draftId: 'Draft id returned by synapse_design_pipeline_begin.',
      tool: 'Native capability name from the runtime catalog.',
      arguments: 'Native tool arguments. Do not pass file/path/URL/import/export/spawn fields.',
    },
  },
  inspect: {
    description: 'Inspect an unpublished draft’s readiness status, resolved layout, quality diagnostics, or rendered screenshot without mutating draft or receipt state.',
    parameters: {
      nodeId: 'Optional node id for screenshot or quality scope. Omit for the root design or whole-page quality.',
      maxDepth: 'Optional layout-only depth, default 6 and max 12. Omit for quality, status, and screenshot inspection.',
      limit: 'Optional quality result limit from 1 to 500.',
      touchTargetOffset: 'Optional quality target offset; use touchTargetsNextOffset and restart from 0 after a mutation.',
    },
  },
  abort: {
    description: 'Abort one unpublished OpenPencil design draft and remove its private native runtime. No target .op file is created.',
  },
  finish: {
    description:
      'Validate the draft, provide its actual final screenshot when available, verify the evidence-bearing review receipt, and publish atomically. A check reported as failed stops publication; a check reported as unverified is published and listed as unverified. Never claim the .op file is generated or saved until published === true and the file exists on disk; use inspect(kind="status") rather than calling finish without review as a status probe.',
    parameters: {
      draftId: 'Draft id returned by pipeline_begin.',
      review: `Review receipt submitted after inspecting the finalized preview: { screens, visual, checks, actions, states, designUpgrades?, reuseNote? }. Each check has a status (${CHECK_STATUSES.join(' | ')}) and cites what was actually examined; each primary action has a kind (${ACTION_KINDS.join(' | ')}). The exact fields are returned in reviewContract.reviewFields.`,
    },
  },
  pocHandoff: {
    description:
      'Record an HTML POC, its evidence ledger, and viewport-bound screenshots, then recover the same evidence and selected style for a Synapse design task.',
    parameters: {
      discovery: 'The confirmed style gallery handle.',
      entry: 'Absolute path (or path relative to the task directory) of the HTML entry file inside this task directory.',
      evidence: 'Absolute path (or path relative to the task directory) of evidence-report.json inside this task directory.',
      files: 'HTML, CSS, JavaScript and asset paths inside this task directory needed to reproduce the POC (exclude generated verification metadata such as style-context.json, evidence-report.json, and shots/).',
      screenshots:
        'Structured PNG captures ({ path, screen, state?, viewport } where viewport is the integer pixel width such as 1440 or 390) covering every planned screen.',
      autoContinue: 'Set true only when the user explicitly asked up front to continue automatically from HTML POC to high-fidelity Synapse design.',
    },
  },
};

function plural(count, noun) {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

export const NEXT = {
  discoveryNeedsContext:
    'Read the conversation and relevant project or OP document. Ask the user only for material missing requirements, then call synapse_design_discovery with stage=context, taskId, contextSummary (>= 40 chars; name the user, their task and what counts as success), sourceReferences, openQuestions, and planned screens ([{name, states?}]). Do not choose a style or create the design first.',
  discoveryNeedsQuestions:
    'Ask the user the material unanswered questions using the normal question tool, then submit the updated context with resolved screens.',
  discoveryNeedsRoute: (taskId) =>
    `Ask the user to choose HTML POC first (options[0]) or direct Synapse high-fidelity design (options[1]) in the user's conversation language using ask_user_question with question id synapse-design-route:${taskId}, then call discovery again (passing route only if the user answered via custom freeform text or already stated their choice). Never assume a default route.`,
  resumeDraft: 'Continue this existing draft. Read its current content before changing it; do not choose a new style.',
  batchStep: ({ layoutIssueCount, remainingScreens }) => {
    const parts = [];
    if (layoutIssueCount > 0) {
      parts.push(`Inspect layout/quality and repair ${plural(layoutIssueCount, 'reported layout issue')} before adding the next section.`);
    }
    parts.push('Confirm that the content planned for this region is present and visible before adjusting its spacing.');
    parts.push(
      remainingScreens.length > 0
        ? `Remaining planned screen(s): ${remainingScreens.join(', ')}.`
        : 'All planned screens appear populated; run scoped lint_document and get_design_quality checks, and simulate each primary action, before calling finish.',
    );
    return parts.join(' ');
  },
  inspectScreenshot: ({ path, rootScreenshot, matchesFinalization }) => {
    const completion = !rootScreenshot
      ? 'This is a child-node detail preview only; finish will still render its own finalized root preview before publication.'
      : matchesFinalization
        ? 'This root user preview matches the finalized version and document SHA checkpoint; call finish exactly once to publish.'
        : 'This root user preview predates a matching finalized checkpoint; call finish once to finalize, render its own final preview, and publish.';
    return `The exact preview is ready at ${path}. A rendered preview is not a completed review: inspect it before drawing conclusions. ${completion}`;
  },
  inspectImageUnavailable: 'This model route cannot receive the screenshot; do not claim visual verification.',
  hostFailure: HOST_FAILURE,
  diagnosticsTruncated:
    'The diagnostic list is incomplete. Inspect get_design_quality and remaining lint_document pages before concluding that the design is clean.',
  previewUnavailable: 'The final screenshot is unavailable; visual verification has not been performed.',
  previewStale: 'The live canvas changed while the automatic final preview was rendered. Call finish once; the stale checkpoint and preview artifact were discarded.',
  visualReviewUnavailable:
    'The current screenshot could not be delivered for visual inspection. Submit finish with review; report screenshot-based checks as unverified, use only methods that were actually executed for any pass, and tell the user that visual verification was not performed.',
  visualReview:
    'Inspect the attached screenshot: first confirm that planned content is present and visible, then review the whole screen, the groups and the details. After any corrections, or when ready to publish, call finish with review bound to screenshotSha256, reporting each check as it was actually performed.',
  refinalizeAfterConcurrentChange: (version) =>
    `The document changed concurrently to version ${version}, so stale finalization and preview proof were discarded. Call finish once to finalize, validate, render the current root preview, and publish when clean.`,
  refinalizeAfterDrift: ({ version, documentSha256 }) =>
    `The authoritative document changed after version ${version} and SHA ${documentSha256} were validated. The stale finalization and root preview proof were discarded. Call finish exactly once; it will finalize, validate, automatically render the current root preview, and publish when clean.`,
  pocRecorded: (ctx) => {
    const isObj = typeof ctx === 'object' && ctx !== null;
    const taskId = typeof ctx === 'string' ? ctx : ctx.taskId;
    const entry = isObj && typeof ctx.entry === 'string' ? ctx.entry : '<entry.html>';
    const entryName = entry.split(/[/\\]/u).at(-1) || 'index.html';
    const hasShot = !isObj || (typeof ctx.primaryScreenshot === 'string' && ctx.primaryScreenshot.trim() !== '');
    const shot = isObj && typeof ctx.primaryScreenshot === 'string' && ctx.primaryScreenshot.trim() !== ''
      ? ctx.primaryScreenshot
      : '<screenshot.png>';
    const screen = isObj && typeof ctx.screen === 'string' && ctx.screen.trim() !== ''
      ? ctx.screen.trim()
      : 'POC Preview';
    if (isObj && ctx.automatic === true) {
      if (!hasShot) {
        return `HTML prototype ${entry} is opened in Preview (Chromium screenshot verification is unverified). Link [${entryName}](${entry}) and state the unverified screenshot status briefly, then call synapse_design_poc_handoff(action="resolve", taskId="${taskId}") because autoContinue was requested.`;
      }
      return `HTML prototype ${entry} is opened in Preview. Echo ![${screen}](${shot}) and [${entryName}](${entry}) briefly, then call synapse_design_poc_handoff(action="resolve", taskId="${taskId}") because autoContinue was requested.`;
    }
    if (!hasShot) {
      return `HTML prototype ${entry} is registered as a deliverable and opened in Preview without verified Chromium screenshots. Mandatory order: (1) end any active tool batch now, (2) emit a visible assistant message with [${entryName}](${entry}), state explicitly that browser screenshot verification is unverified, and summarize passed/unverified checks + actions, (3) then call ask_user_question (id synapse-design-poc:${taskId}, options[0] continue to high-fidelity Synapse design, options[1] revise HTML POC first, options[2] keep HTML POC for now). When confirmed, call synapse_design_poc_handoff(action="resolve", taskId="${taskId}") in the same turn.`;
    }
    return `HTML prototype ${entry} is registered as a deliverable and opened in Preview. Mandatory order: (1) end any active tool batch now, (2) emit a visible assistant message with [${entryName}](${entry}), inline screenshot ![${screen}](${shot}), and passed/unverified check + action summary, (3) then call ask_user_question (id synapse-design-poc:${taskId}, options[0] continue to high-fidelity Synapse design, options[1] revise HTML POC first, options[2] keep HTML POC for now). When confirmed, call synapse_design_poc_handoff(action="resolve", taskId="${taskId}") in the same turn.`;
  },
  // Ink measurements are evidence about one text node. They are not a target to
  // reach: a line of a multi-line title is not meant to sit at its parent's centre.
  liveEditApplied:
    'Applied to the live Synapse Design canvas (auto-refreshed and auto-saved). Check the attached image and visualEvidence.textMeasurements against the intent of the edit, and look at the siblings, parent and adjacent regions it may have affected. An ink offset is a measurement, not an instruction: correct it only where the text is meant to be optically centred in that reference, and never move one line of a stacked group to the parent centre. Do not call synapse_design_render.',
  pocResolved:
    'Read the entry and relevant source files; use read_image for the recorded screenshots. Before building, confirm with the user in Stage C whether they want a strict fidelity replica or a design upgrade within confirmed scope (and whether multi-state screens use independent frames or in-screen variants). Preserve screen list, state scope, copy/core flow, and verifiable actions; upgrade visual hierarchy, typography, spacing, component craft, and responsive details as needed and record each upgrade in designUpgrades ({ what, why }, deviation="upgrade"). For any scope deviation (omitted screen, dropped shell, changed state expression, or reduced content/actions), ask the user before building it via ask_user_question (question id synapse-design-deviation:<draftId>:<screen>, options[0] approve deviation, options[1] keep confirmed POC scope).',
  inspectStatus:
    'Read-only draft readiness snapshot; draft content, finalized preview, and verified receipts are untouched.',
  rendererDegradedWarning:
    'Exact CanvasKit/OpenPencil headless renderer is unavailable in this environment; screenshots will fall back to lower-fidelity runtime preview until Chromium or OpenPencil is available.',
};

export const POC_DELIVERABLE_TEXT = {
  htmlPrototype: 'HTML POC Prototype',
  screenshot: ({ screen, viewport }) =>
    `${typeof screen === 'string' && screen.trim() !== '' ? screen.trim() : 'POC'} screenshot${typeof viewport === 'number' ? ` (${viewport}px)` : ''}`,
};

export const POLICY_REASON = {
  htmlIntermediateForbidden: 'OP design tasks cannot use HTML as an intermediate design route.',
  htmlImportForbidden: 'OP design tasks cannot use HTML or webpage import as an intermediate design route.',
  invalidPromptSection: 'Use the OP design prompt sections for this task; load the selected DESIGN from the style catalog.',
  pocPhaseActive: 'This task is in the HTML POC phase; finish or resolve the POC handoff before changing the canvas.',
  otherWorkflowRequested: 'The user explicitly requested a different workflow; do not start an OP design without their request.',
  pocQuestionBeforeRecord:
    'Record and verify the HTML POC with synapse_design_poc_handoff(action="record") first so the HTML prototype opens in Preview and screenshots are verified before calling ask_user_question.',
  pocQuestionWithoutScreenshotEcho: ({ taskId, entry, primaryScreenshot, screen }) => {
    const entryPath = typeof entry === 'string' && entry !== '' ? entry : '<entry.html>';
    const entryName = entryPath.split(/[/\\]/u).at(-1) || 'index.html';
    if (typeof primaryScreenshot !== 'string' || primaryScreenshot === '') {
      return `Do not ask synapse-design-poc:${taskId} before showing the POC to the user. ${entryPath} is already opened in Preview; end any active tool script, emit a visible assistant message containing [${entryName}](${entryPath}) and stating which browser checks remain unverified, and only then call ask_user_question.`;
    }
    const shotPath = primaryScreenshot;
    const label = typeof screen === 'string' && screen.trim() !== '' ? screen.trim() : 'POC Preview';
    return `Do not ask synapse-design-poc:${taskId} before showing the POC to the user. ${entryPath} is already opened in Preview; end any active tool script, emit a visible assistant message containing [${entryName}](${entryPath}) and the inline screenshot ![${label}](${shotPath}) with your check summary, and only then call ask_user_question.`;
  },
};

export const FINALIZATION_NOTE = {
  changedBytes: ({ beforeVersion, version }) =>
    `Native finalization changed document bytes and advanced version from ${beforeVersion} to ${version}. The finalized checkpoint is informational only and does not request a repair.`,
  advancedVersion: ({ beforeVersion, version }) =>
    `Native finalization advanced version from ${beforeVersion} to ${version} without changing document bytes. The finalized checkpoint is informational only and does not request a repair.`,
  unchanged: 'Native finalization preserved the current version and document bytes. The finalized checkpoint is informational only and does not request a repair.',
};

/**
 * What a publication result tells the model to report. Published, applied and
 * saved are separate facts, and so are verified and unverified checks; the
 * report keeps them apart so that a successful write is not read as a
 * successful review.
 */
export function publicationReport({
  path,
  fileExists = true,
  unverifiedChecks = [],
  actions = [],
  omittedScreens = [],
  designUpgrades = [],
  visualVerification,
}) {
  const byKind = Object.fromEntries(ACTION_KINDS.map((kind) => [kind, actions.filter((action) => action.kind === kind)]));
  const lines = [
    `Published ${path} atomically (draftStatus="published", published=true, fileExists=${String(fileExists)}): the changes are applied and the file is saved on disk.`,
  ];
  lines.push('Report draft status, publish status (published: true), and whether the output file path exists on disk explicitly. This is a design document, not a production implementation.');
  if (visualVerification !== 'image_provided') {
    lines.push('No screenshot was delivered for inspection, so visual verification was not performed.');
  }
  if (designUpgrades.length > 0) {
    lines.push(
      `Share the recorded design upgrades with the user: ${designUpgrades.map((u) => `${u.screen ? `[${u.screen}] ` : ''}${u.what} (${u.why})`).join('; ')}.`,
    );
  }
  if (unverifiedChecks.length > 0) {
    lines.push(`Tell the user these checks are unverified: ${unverifiedChecks.map((check) => `${check.dimension} (${check.uncovered})`).join('; ')}.`);
  }
  const drawn = byKind['visual-only'].length + byKind['not-implemented'].length;
  if (drawn > 0) {
    lines.push(
      `Tell the user that ${plural(byKind.verifiable.length, 'action')} produced an observed result, ${plural(byKind['visual-only'].length, 'action')} ${byKind['visual-only'].length === 1 ? 'is' : 'are'} drawn only, and ${plural(byKind['not-implemented'].length, 'action')} ${byKind['not-implemented'].length === 1 ? 'is' : 'are'} not implemented.`,
    );
  }
  if (omittedScreens.length > 0) {
    lines.push(`Tell the user which planned screens were omitted: ${omittedScreens.map((screen) => screen.name).join(', ')}.`);
  }
  return {
    note: lines.join(' '),
    ...(unverifiedChecks.length === 0 ? {} : { unverifiedChecks }),
    ...(actions.length === 0 ? {} : { actions: byKind }),
    ...(designUpgrades.length === 0 ? {} : { designUpgrades }),
  };
}

/** The staged prompt mode for each point where a host hands guidance to the model. */
export const STAGE_PROMPT_MODE = {
  styleResolved: 'plan',
  draftBegun: 'build',
  draftResumed: 'build',
};
