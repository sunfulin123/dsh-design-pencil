/**
 * Pure discovery-funnel and structured question-answer validation for Synapse Design.
 *
 * Host adapters supply session persistence, project file reading, and event
 * snapshots; the rules for context summaries, planned screens, canvas bounds,
 * and positional `ask_user_question` options live here in one place.
 */

import { CONTENT_STATES, isRecord } from './draft-canvas-contract.mjs';
import { POC_DELIVERABLE_TEXT } from './design-workflow-text.mjs';

const VALID_CONTENT_STATE = new Set(CONTENT_STATES);

function parseScreenStates(rawStates, screenName) {
  if (rawStates === undefined) return undefined;
  if (!Array.isArray(rawStates) || rawStates.length > CONTENT_STATES.length) {
    throw new Error(`Invalid states list for planned screen ${screenName}`);
  }
  const states = [];
  for (const st of rawStates) {
    if (typeof st !== 'string' || !VALID_CONTENT_STATE.has(st)) {
      throw new Error(`Unsupported content state "${String(st)}" on screen ${screenName}`);
    }
    if (!states.includes(st)) states.push(st);
  }
  return states.length > 0 ? states : undefined;
}

function parseOnePlannedScreen(item, seen) {
  if (!isRecord(item)) {
    throw new Error('Each planned screen requires a non-empty name (at most 120 characters)');
  }
  const name = typeof item.name === 'string' ? item.name.trim() : '';
  if (name.length === 0 || name.length > 120) {
    throw new Error('Each planned screen requires a non-empty name (at most 120 characters)');
  }
  const key = name.toLocaleLowerCase('en-US');
  if (seen.has(key)) throw new Error(`Duplicate planned screen name: ${name}`);
  seen.add(key);
  const states = parseScreenStates(item.states, name);
  return states === undefined ? { name } : { name, states };
}

export function parsePlannedScreens(raw) {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 32) {
    throw new Error(
      'Provide one to thirty-two planned screens ({ name, states? }) in synapse_design_discovery(stage="context") once openQuestions is empty',
    );
  }
  const seen = new Set();
  return raw.map((item) => parseOnePlannedScreen(item, seen));
}

export function validateFunnelContextInput(args, readPaths) {
  const summary = typeof args?.contextSummary === 'string' ? args.contextSummary.trim() : '';
  if (summary.length < 8 || summary.length > 16_384) {
    throw new Error('A concise summary of the understood design requirements is required');
  }
  if (!Array.isArray(args?.sourceReferences) || !Array.isArray(args?.openQuestions)) {
    throw new Error('Provide sourceReferences and openQuestions, including empty arrays when none apply');
  }
  const sources = args.sourceReferences;
  const questions = args.openQuestions;
  if (
    sources.length > 32
    || questions.length > 8
    || [...sources, ...questions].some((item) => typeof item !== 'string' || item.length > 1024)
  ) {
    throw new Error('The design context references or questions are invalid');
  }
  const verifiedSet = readPaths instanceof Set ? readPaths : new Set(readPaths ?? []);
  for (const source of sources) {
    const match = /^(?:project|file):(.+)$/u.exec(source);
    if (match?.[1] !== undefined && !verifiedSet.has(match[1])) {
      throw new Error(`The cited source was not successfully read: ${match[1]}`);
    }
  }
  const canvasHints = {};
  if (args.platform === 'web' || args.platform === 'mobile') canvasHints.platform = args.platform;
  if (typeof args.canvasWidth === 'number' && Number.isInteger(args.canvasWidth) && args.canvasWidth >= 240 && args.canvasWidth <= 3840) {
    canvasHints.canvasWidth = args.canvasWidth;
  }
  if (typeof args.canvasHeight === 'number' && Number.isInteger(args.canvasHeight) && args.canvasHeight >= 240 && args.canvasHeight <= 20000) {
    canvasHints.canvasHeight = args.canvasHeight;
  }
  if (questions.length > 0) {
    const partialScreens = Array.isArray(args.screens) && args.screens.length > 0
      ? parsePlannedScreens(args.screens)
      : undefined;
    return { status: 'needs_questions', summary, sources, questions, canvasHints, partialScreens };
  }
  if (summary.length < 40) {
    throw new Error('A substantive contextSummary of at least 40 characters is required once open questions are resolved');
  }
  return {
    status: 'ready',
    summary,
    sources,
    questions: [],
    canvasHints,
    screens: parsePlannedScreens(args.screens),
  };
}

function optionLabelsOf(options) {
  if (!Array.isArray(options) || options.length < 2) return undefined;
  const first = isRecord(options[0]) ? options[0].label : undefined;
  const second = isRecord(options[1]) ? options[1].label : undefined;
  return typeof first === 'string' && first.length > 0 && typeof second === 'string' && second.length > 0
    ? [first, second]
    : undefined;
}

function singleSelectedAnswer(value, questionId) {
  const answers = isRecord(value) ? value.answers : undefined;
  if (!Array.isArray(answers)) return undefined;
  const answer = answers.find((item) => isRecord(item) && item.id === questionId);
  if (!isRecord(answer)) return undefined;
  const custom = typeof answer.custom === 'string' ? answer.custom.trim() : '';
  if (custom.length > 0 || !Array.isArray(answer.selected)) return undefined;
  const selections = answer.selected.filter((item) => typeof item === 'string');
  return selections.length === 1 ? selections[0] : undefined;
}

/** Map a structured `ask_user_question` selection strictly by option index (`options[0]` = html, `options[1]` = synapse). */
export function routeFromQuestionAnswer(value, taskId, options) {
  const selected = singleSelectedAnswer(value, `synapse-design-route:${taskId}`);
  const labels = optionLabelsOf(options);
  if (selected === undefined || labels === undefined || labels[0] === labels[1]) return undefined;
  if (selected === labels[0]) return 'html';
  return selected === labels[1] ? 'synapse' : undefined;
}

/** Map a canonical `synapse-design-poc:<taskId>` question selection (`options[0]` = continue, `options[1..]` = hold). */
export function pocFromQuestionAnswer(value, taskId, options) {
  const selected = singleSelectedAnswer(value, `synapse-design-poc:${taskId}`);
  const first = Array.isArray(options) && options.length >= 2 && isRecord(options[0]) ? options[0].label : undefined;
  if (selected === undefined || typeof first !== 'string' || first.length === 0) return undefined;
  return selected === first ? 'continue' : 'hold';
}

/** Map a `synapse-design-deviation:<draftId>:<screen>` question selection (`options[0]` = approve, `options[1..]` = reject). */
export function deviationDecisionFromQuestionAnswer(value, questionId, options) {
  if (typeof questionId !== 'string' || !questionId.startsWith('synapse-design-deviation:')) return undefined;
  const selected = singleSelectedAnswer(value, questionId);
  const labels = optionLabelsOf(options);
  if (selected === undefined || labels === undefined || labels[0] === labels[1]) return undefined;
  return selected === labels[0] ? 'approved' : 'rejected';
}

export function routeQuestionOptions(value, questionId) {
  const questions = isRecord(value) ? value.questions : undefined;
  if (!Array.isArray(questions)) return undefined;
  const matched = questions.find((item) => isRecord(item) && item.id === questionId);
  return isRecord(matched) && Array.isArray(matched.options) ? matched.options : undefined;
}

export function deviationQuestionsFromCallArgs(rawArgs) {
  let parsed = rawArgs;
  if (typeof rawArgs === 'string') {
    try {
      parsed = JSON.parse(rawArgs);
    } catch {
      return [];
    }
  }
  const questions = isRecord(parsed) ? parsed.questions : undefined;
  if (!Array.isArray(questions)) return [];
  const entries = [];
  for (const item of questions) {
    if (!isRecord(item) || typeof item.id !== 'string' || !item.id.startsWith('synapse-design-deviation:')) continue;
    if (Array.isArray(item.options)) entries.push({ id: item.id, options: item.options });
  }
  return entries;
}

/**
 * Extract the deliverable files (`[{ path, description }]`, HTML entry first so
 * Preview opens the live prototype automatically, followed by up to 3 PNG shots)
 * from a `synapse_design_poc_handoff(action="record")` result.
 */
export function pocDeliverableFiles(pocResult) {
  if (!isRecord(pocResult) || pocResult.status !== 'poc_recorded') return [];
  const state = isRecord(pocResult.pocState) ? pocResult.pocState : undefined;
  const entry = typeof state?.entry === 'string' && state.entry.trim() !== '' ? state.entry.trim() : undefined;
  if (entry === undefined) return [];
  const seen = new Set([entry]);
  const files = [{ path: entry, description: POC_DELIVERABLE_TEXT.htmlPrototype }];
  const rawShots = Array.isArray(state?.screenshots) ? state.screenshots : [];
  for (const shot of rawShots) {
    if (files.length >= 4) break;
    const path = isRecord(shot) && typeof shot.path === 'string' ? shot.path.trim() : '';
    if (path === '' || seen.has(path)) continue;
    seen.add(path);
    files.push({
      path,
      description: POC_DELIVERABLE_TEXT.screenshot({
        screen: shot.screen,
        viewport: typeof shot.viewport === 'number' ? shot.viewport : undefined,
      }),
    });
  }
  return files;
}

export function pocQuestionTaskIdsFromCallArgs(rawArgs) {
  let parsed = rawArgs;
  if (typeof rawArgs === 'string') {
    try {
      parsed = JSON.parse(rawArgs);
    } catch {
      return [];
    }
  }
  const questions = isRecord(parsed) ? parsed.questions : undefined;
  if (!Array.isArray(questions)) return [];
  const ids = [];
  for (const item of questions) {
    if (!isRecord(item) || typeof item.id !== 'string') continue;
    const match = /^synapse-design-poc:([a-f0-9]{32})$/u.exec(item.id.trim());
    if (match?.[1] !== undefined && !ids.includes(match[1])) ids.push(match[1]);
  }
  return ids;
}

function normalizePosixPath(raw) {
  return raw.replaceAll('\\', '/').replace(/^(?:\.\/)+/u, '').trim();
}

function extractMarkdownImageDestinations(markdownText) {
  if (typeof markdownText !== 'string' || !markdownText.includes('![')) return [];
  const destinations = [];
  const pattern = /!\[[^\]]*\]\(\s*(?:<([^>\n]+)>|([^\s)\n]+))(?:\s+["'(][^)\n]*)?\s*\)/gu;
  for (const match of markdownText.matchAll(pattern)) {
    const rawTarget = (match[1] ?? match[2] ?? '').split(/[?#]/u)[0]?.trim() ?? '';
    if (rawTarget === '') continue;
    let decoded = rawTarget;
    try {
      decoded = decodeURIComponent(rawTarget);
    } catch {
      // Keep raw target when percent escapes are literal.
    }
    destinations.push(normalizePosixPath(decoded));
  }
  return destinations;
}

/** True when `markdownText` embeds at least one `![alt](...)` image matching a recorded POC screenshot. */
export function assistantMarkdownEchoesScreenshot(markdownText, screenshots) {
  const shotPaths = (Array.isArray(screenshots) ? screenshots : [])
    .map((shot) => (isRecord(shot) && typeof shot.path === 'string' ? normalizePosixPath(shot.path) : ''))
    .filter((item) => item !== '');
  if (shotPaths.length === 0) return false;
  const destinations = extractMarkdownImageDestinations(markdownText);
  if (destinations.length === 0) return false;
  return destinations.some((dest) =>
    shotPaths.some((shot) => {
      if (dest === shot) return true;
      if (dest.startsWith('/') || /^[A-Za-z]:\//u.test(dest)) return false;
      return shot.endsWith(`/${dest}`);
    }),
  );
}

function extractRecordedPocEvent(event, owner, taskId) {
  if (!isRecord(event) || (event.type !== 'tool/result' && event.type !== 'tool/ptc-dispatch')) return undefined;
  const meta = isRecord(event.data) && isRecord(event.data.meta) ? event.data.meta : undefined;
  const state = isRecord(meta?.pocState) ? meta.pocState : undefined;
  if (
    meta?.status !== 'poc_recorded'
    || state === undefined
    || state.taskId !== taskId
    || (owner !== undefined && state.owner !== owner)
    || typeof state.entry !== 'string'
    || !Array.isArray(state.screenshots)
  ) {
    return undefined;
  }
  return {
    entry: state.entry,
    screenshots: state.screenshots,
  };
}

function assistantTextOfEvent(event) {
  if (!isRecord(event) || (event.type !== 'assistant/message' && event.type !== 'assistant/attempt')) return '';
  const message = isRecord(event.data) && isRecord(event.data.message) ? event.data.message : undefined;
  const content = Array.isArray(message?.content) ? message.content : [];
  return content
    .filter((block) => isRecord(block) && block.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text)
    .join('\n');
}

/**
 * Guard `ask_user_question` when it asks `synapse-design-poc:<taskId>`:
 * 1. `synapse_design_poc_handoff(action="record", taskId)` must have succeeded first
 *    (which registers the HTML + PNG deliverables and opens the HTML in Preview).
 * 2. A post-record assistant message must have echoed at least one recorded
 *    screenshot inline via Markdown image syntax `![...](<screenshot-path>)`.
 */
export function checkPocQuestionReadiness(rawArgs, events, owner) {
  const taskIds = pocQuestionTaskIdsFromCallArgs(rawArgs);
  if (taskIds.length === 0) return { ok: true };
  const list = Array.isArray(events) ? events : [];
  for (const taskId of taskIds) {
    let recordIndex = -1;
    let recorded;
    for (let i = 0; i < list.length; i += 1) {
      const candidate = extractRecordedPocEvent(list[i], owner, taskId);
      if (candidate !== undefined) {
        recordIndex = i;
        recorded = candidate;
      }
    }
    if (recorded === undefined) {
      return { ok: false, kind: 'missing_record', taskId };
    }
    const requiresImageEcho = recorded.screenshots.length > 0;
    const entryName = recorded.entry.split(/[/\\]/u).at(-1) || '';
    let echoed = false;
    for (let i = recordIndex + 1; i < list.length; i += 1) {
      const text = assistantTextOfEvent(list[i]);
      if (text === '') continue;
      if (requiresImageEcho ? assistantMarkdownEchoesScreenshot(text, recorded.screenshots) : (text.includes(recorded.entry) || (entryName !== '' && text.includes(entryName)))) {
        echoed = true;
        break;
      }
    }
    if (!echoed) {
      const primary = isRecord(recorded.screenshots[0]) ? recorded.screenshots[0] : undefined;
      return {
        ok: false,
        kind: 'missing_screenshot_echo',
        taskId,
        entry: recorded.entry,
        primaryScreenshot: typeof primary?.path === 'string' ? primary.path : '',
        screen: typeof primary?.screen === 'string' ? primary.screen : 'POC Preview',
      };
    }
  }
  return { ok: true };
}
