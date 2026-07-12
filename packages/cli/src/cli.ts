#!/usr/bin/env node
import * as fs from 'node:fs';
import * as path from 'node:path';
import { computeDiff } from './diff.js';
import { renderBadge } from './report/badge.js';
import { renderMarkdown } from './report/markdown.js';
import { renderTerminal } from './report/terminal.js';
import { createScanContext } from './scan.js';
import { buildReport, TOOL_VERSION } from './score.js';
import type { Report } from './types.js';

const HELP = `harness-score — deterministic harness-maturity scanner for AI-assisted repositories

Usage:
  harness-score [path] [options]

Options:
  --json               Print the full report as JSON instead of the terminal view
  --md <file|->        Write a markdown report to <file> (or stdout with "-")
  --badge <file>       Write an SVG maturity badge to <file>
  --min-level <0-4>    Exit with code 1 when the maturity level is below <n> (CI gate)
  --diff <file>        Compare against a baseline report (a previous --json output)
  --quiet              Suppress the terminal report
  --version            Print version
  --help               Show this help

The scan is 100% deterministic: filesystem reads and parsing only.
No LLM calls, no network, no telemetry.

Guide: https://paladini.github.io/harness-score/
`;

interface Args {
  root: string;
  json: boolean;
  md: string | null;
  badge: string | null;
  minLevel: number | null;
  diff: string | null;
  quiet: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    root: '.',
    json: false,
    md: null,
    badge: null,
    minLevel: null,
    diff: null,
    quiet: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]!;
    switch (arg) {
      case '--help':
      case '-h':
        process.stdout.write(HELP);
        process.exit(0);
        break;
      case '--version':
      case '-v':
        process.stdout.write(`${TOOL_VERSION}\n`);
        process.exit(0);
        break;
      case '--json':
        args.json = true;
        break;
      case '--quiet':
      case '-q':
        args.quiet = true;
        break;
      case '--md':
        args.md = argv[++i] ?? '-';
        break;
      case '--badge': {
        const value = argv[++i];
        if (!value) return fail('--badge requires a file path');
        args.badge = value;
        break;
      }
      case '--diff': {
        const value = argv[++i];
        if (!value) return fail('--diff requires a path to a baseline JSON report');
        args.diff = value;
        break;
      }
      case '--min-level': {
        const value = Number(argv[++i]);
        if (!Number.isInteger(value) || value < 0 || value > 4) {
          return fail('--min-level must be an integer between 0 and 4');
        }
        args.minLevel = value;
        break;
      }
      default:
        if (arg.startsWith('-')) return fail(`Unknown option: ${arg}\n\n${HELP}`);
        args.root = arg;
    }
  }
  return args;
}

function fail(message: string): never {
  process.stderr.write(`harness-score: ${message}\n`);
  process.exit(2);
}

/** Minimal structural check that parsed JSON is actually a harness-score Report, not just any JSON. */
function looksLikeReport(value: unknown): value is Report {
  if (!value || typeof value !== 'object') return false;
  const r = value as Record<string, unknown>;
  const level = r.level as Record<string, unknown> | undefined;
  return (
    typeof level === 'object' &&
    level !== null &&
    typeof level.index === 'number' &&
    Array.isArray(r.checks) &&
    Array.isArray(r.dimensions) &&
    typeof r.score === 'object' &&
    r.score !== null
  );
}

const args = parseArgs(process.argv.slice(2));
const rootAbs = path.resolve(args.root);
if (!fs.existsSync(rootAbs) || !fs.statSync(rootAbs).isDirectory()) {
  fail(`not a directory: ${rootAbs}`);
}

const report = buildReport(createScanContext(rootAbs));

let baseline: Report | null = null;
let diff: ReturnType<typeof computeDiff> | null = null;
if (args.diff !== null) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(args.diff, 'utf8'));
  } catch (error) {
    fail(`--diff: could not read/parse baseline report at ${args.diff}: ${String(error)}`);
  }
  if (!looksLikeReport(parsed)) {
    fail(
      `--diff: ${args.diff} does not look like a harness-score report ` +
        '(expected the JSON output of a previous --json run).',
    );
  }
  baseline = parsed;
  diff = computeDiff(baseline, report);
}

if (args.json) {
  const payload = diff ? { current: report, baseline, diff } : report;
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
} else if (!args.quiet) {
  process.stdout.write(`${renderTerminal(report, diff)}\n`);
}

if (args.md !== null) {
  const markdown = renderMarkdown(report, diff);
  if (args.md === '-') {
    process.stdout.write(markdown);
  } else {
    fs.writeFileSync(args.md, markdown, 'utf8');
    if (!args.quiet) process.stderr.write(`markdown report written to ${args.md}\n`);
  }
}

if (args.badge !== null) {
  fs.writeFileSync(args.badge, renderBadge(report), 'utf8');
  if (!args.quiet) process.stderr.write(`badge written to ${args.badge}\n`);
}

if (args.minLevel !== null && report.level.index < args.minLevel) {
  process.stderr.write(
    `harness-score: maturity L${report.level.index} is below required L${args.minLevel} — ` +
      `missing: ${report.level.nextLevelGaps.join('; ') || 'see failed checks'}\n`,
  );
  process.exit(1);
}
