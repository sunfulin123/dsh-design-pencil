/** Validate bounded local capture plans before opening a browser. */
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ALLOWED_ACTIONS = new Set([
  "click",
  "fill",
  "select",
  "submit",
  "focus",
  "press",
  "waitFor",
  "assertText",
  "assertVisible",
  "assertCount",
  "assertValue",
  "assertFocused",
  "screenshot",
]);

export class PocStageError extends Error {
  constructor(
    message,
    { kind = "browser", stage, elapsedMs, stages = [], stderrTail = "", cause } = {},
  ) {
    super(message, cause ? { cause } : undefined);
    this.name = "PocStageError";
    this.kind = kind;
    this.stage = stage;
    this.elapsedMs = elapsedMs;
    this.stages = stages;
    this.stderrTail = stderrTail;
  }

  toDiagnostics() {
    return {
      kind: this.kind,
      failedStage: this.stage,
      elapsedMs: this.elapsedMs,
      stages: this.stages,
      ...(this.stderrTail ? { stderrTail: this.stderrTail } : {}),
      error: this.message,
    };
  }
}

export function resolveLocalCaptureUrl(source) {
  if (typeof source !== "string" || !source.trim()) {
    throw new PocStageError("A local HTML file or localhost URL is required", {
      kind: "validation",
      stage: "validate-args",
      elapsedMs: 0,
    });
  }
  if (/^https?:/i.test(source)) {
    const parsed = new URL(source);
    if (!["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname)) {
      throw new PocStageError(
        "Only local POC servers (localhost / 127.0.0.1 / [::1]) may be captured",
        {
          kind: "validation",
          stage: "validate-args",
          elapsedMs: 0,
        },
      );
    }
    return parsed;
  }
  return pathToFileURL(resolve(source));
}

function validateDimension(value, label) {
  const num = Number(value);
  if (!Number.isInteger(num) || num < 200 || num > 4096) {
    throw new PocStageError(`${label} must be an integer between 200 and 4096 pixels`, {
      kind: "validation",
      stage: "validate-args",
      elapsedMs: 0,
    });
  }
  return num;
}

function validateFrame(frame) {
  if (frame === undefined) return;
  const selectors = Array.isArray(frame) ? frame : [frame];
  if (
    !selectors.length ||
    selectors.length > 4 ||
    selectors.some((s) => typeof s !== "string" || !s.trim() || s.length > 2048)
  )
    throw new Error("frame requires one to four CSS iframe selectors");
}

function validateStep(step, sessionName, index) {
  if (
    !step ||
    typeof step !== "object" ||
    Array.isArray(step) ||
    !ALLOWED_ACTIONS.has(step.action)
  ) {
    throw new PocStageError(
      `Invalid step #${index + 1} in session "${sessionName}": action must be one of ${[...ALLOWED_ACTIONS].join(", ")}`,
      { kind: "validation", stage: "validate-steps", elapsedMs: 0 },
    );
  }
  if (step.action === "screenshot") {
    if (typeof step.out !== "string" || !step.out.trim() || !/\.png$/i.test(step.out.trim())) {
      throw new PocStageError(
        `Screenshot step #${index + 1} in "${sessionName}" requires a .png "out" path`,
        {
          kind: "validation",
          stage: "validate-steps",
          elapsedMs: 0,
        },
      );
    }
    if (step.selector && step.clip)
      throw new Error("Screenshot accepts selector or clip, not both");
    if (
      step.clip &&
      (!["x", "y", "width", "height"].every((key) => Number.isFinite(step.clip[key])) ||
        step.clip.x < 0 ||
        step.clip.y < 0 ||
        step.clip.width < 1 ||
        step.clip.height < 1)
    )
      throw new Error("Invalid screenshot clip");
    validateFrame(step.frame);
    return { ...step, out: step.out.trim() };
  }
  if (step.action !== "press" && (typeof step.selector !== "string" || !step.selector.trim())) {
    throw new PocStageError(
      `Step #${index + 1} (${step.action}) in "${sessionName}" requires a non-empty CSS selector`,
      {
        kind: "validation",
        stage: "validate-steps",
        elapsedMs: 0,
      },
    );
  }
  validateFrame(step.frame);
  return step;
}

export function normalizeCapturePlan(rawPlan, fallbackUrl) {
  if (!rawPlan || typeof rawPlan !== "object" || Array.isArray(rawPlan)) {
    throw new PocStageError('Steps plan must be a JSON object with a non-empty "sessions" array', {
      kind: "validation",
      stage: "validate-steps",
      elapsedMs: 0,
    });
  }
  const rawSessions = Array.isArray(rawPlan.sessions) ? rawPlan.sessions : [];
  if (rawSessions.length === 0 || rawSessions.length > 16) {
    throw new PocStageError("Steps plan must contain 1 to 16 viewport sessions", {
      kind: "validation",
      stage: "validate-steps",
      elapsedMs: 0,
    });
  }
  const sessions = rawSessions.map((session, sIdx) => {
    if (!session || typeof session !== "object" || Array.isArray(session)) {
      throw new PocStageError(`Session #${sIdx + 1} must be an object`, {
        kind: "validation",
        stage: "validate-steps",
        elapsedMs: 0,
      });
    }
    const width = validateDimension(session.width ?? 1440, `Session #${sIdx + 1} width`);
    const height = validateDimension(session.height ?? 900, `Session #${sIdx + 1} height`);
    const name =
      typeof session.name === "string" && session.name.trim()
        ? session.name.trim()
        : `${width}x${height}`;
    if (session.scheme !== undefined && !["light", "dark"].includes(session.scheme))
      throw new Error("scheme must be light or dark");
    const url = session.url
      ? resolveLocalCaptureUrl(session.url)
      : resolveLocalCaptureUrl(fallbackUrl);
    const rawSteps = Array.isArray(session.steps) ? session.steps : [];
    if (rawSteps.length > 64) {
      throw new PocStageError(`Session "${name}" exceeds the 64-step limit`, {
        kind: "validation",
        stage: "validate-steps",
        elapsedMs: 0,
      });
    }
    return {
      name,
      scheme: session.scheme,
      width,
      height,
      url,
      steps: rawSteps.map((st, idx) => validateStep(st, name, idx)),
    };
  });
  return {
    timeoutMs: rawPlan.timeoutMs === undefined ? undefined : Number(rawPlan.timeoutMs),
    sessions,
  };
}
