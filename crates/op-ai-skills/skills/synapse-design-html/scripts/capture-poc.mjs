#!/usr/bin/env node
/**
 * Capture local POC screenshots and run declarative multi-viewport interaction
 * checks in a single bounded Chromium session.
 */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  PocStageError,
  normalizeCapturePlan,
  resolveLocalCaptureUrl,
  runPocCapturePlan,
} from './poc-browser-runner.mjs';

function parseCliArgs(argv) {
  const opts = {
    url: undefined,
    out: undefined,
    steps: undefined,
    width: 1440,
    height: 900,
    timeoutMs: undefined,
    allowUnverified: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    if (flag === '--allow-unverified') {
      opts.allowUnverified = true;
      continue;
    }
    const next = argv[i + 1];
    if (!flag.startsWith('--') || next === undefined) {
      throw new PocStageError(
        'Use --url <local page> (--out <png> [--width <px>] [--height <px>] | --steps <plan.json>) [--timeout-ms <ms>] [--allow-unverified]',
        { kind: 'validation', stage: 'parse-args', elapsedMs: 0 },
      );
    }
    i += 1;
    if (flag === '--url') opts.url = next;
    else if (flag === '--out') opts.out = next;
    else if (flag === '--steps') opts.steps = next;
    else if (flag === '--width') opts.width = Number(next);
    else if (flag === '--height') opts.height = Number(next);
    else if (flag === '--timeout-ms') opts.timeoutMs = Number(next);
    else {
      throw new PocStageError(`Unknown option: ${flag}`, {
        kind: 'validation',
        stage: 'parse-args',
        elapsedMs: 0,
      });
    }
  }
  return opts;
}

const baseDir = process.env.SYNAPSE_DESIGN_TASK_DIR
  ? resolve(process.env.SYNAPSE_DESIGN_TASK_DIR)
  : process.cwd();

let cli;
try {
  cli = parseCliArgs(process.argv.slice(2));
  let plan;
  const singleShot = !cli.steps;
  if (cli.steps) {
    const rawJson = JSON.parse(await readFile(resolve(baseDir, cli.steps), 'utf8'));
    plan = normalizeCapturePlan(rawJson, cli.url);
  } else {
    if (!cli.url || !cli.out || !/\.png$/i.test(cli.out)
      || !Number.isInteger(cli.width) || !Number.isInteger(cli.height)
      || cli.width < 200 || cli.width > 4096 || cli.height < 200 || cli.height > 4096) {
      throw new PocStageError(
        'A local URL, PNG output, and viewport between 200 and 4096 pixels are required',
        { kind: 'validation', stage: 'validate-args', elapsedMs: 0 },
      );
    }
    resolveLocalCaptureUrl(cli.url);
    plan = normalizeCapturePlan(
      {
        sessions: [{
          name: `${cli.width}x${cli.height}`,
          width: cli.width,
          height: cli.height,
          steps: [{ action: 'screenshot', out: cli.out }],
        }],
      },
      cli.url,
    );
  }

  const result = await runPocCapturePlan({
    sessions: plan.sessions,
    timeoutMs: cli.timeoutMs ?? plan.timeoutMs ?? 35_000,
    baseDir,
  });

  if (singleShot) {
    const primary = result.screenshots[0];
    console.log(JSON.stringify({
      ...primary,
      totalMs: result.totalMs,
      stages: result.stages,
    }));
  } else {
    console.log(JSON.stringify(result));
  }
} catch (error) {
  const stageError = error instanceof PocStageError
    ? error
    : new PocStageError(error?.message || String(error), { kind: 'browser', stage: 'unknown', elapsedMs: 0 });
  if (cli?.allowUnverified && stageError.kind === 'browser') {
    console.log(JSON.stringify({
      status: 'unverified',
      renderer: 'unavailable',
      uncovered: stageError.message,
      diagnostics: stageError.toDiagnostics(),
      stages: stageError.stages,
      totalMs: stageError.elapsedMs,
    }));
    process.exit(0);
  }
  console.error(JSON.stringify(stageError.toDiagnostics()));
  process.exit(1);
}
