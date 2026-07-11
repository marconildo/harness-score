import type { Check, ScanContext } from '../types.js';
import { safeJsonParse } from '../util.js';

const HOOKS_PATH = '.cursor/hooks.json';

/** Events documented at cursor.com/docs — kept permissive on purpose. */
const KNOWN_EVENTS = new Set([
  'sessionStart',
  'sessionEnd',
  'preToolUse',
  'postToolUse',
  'postToolUseFailure',
  'subagentStart',
  'subagentStop',
  'beforeShellExecution',
  'afterShellExecution',
  'beforeMCPExecution',
  'afterMCPExecution',
  'beforeReadFile',
  'afterFileEdit',
  'beforeSubmitPrompt',
  'preCompact',
  'stop',
  'afterAgentResponse',
  'afterAgentThought',
  'beforeTabFileRead',
  'afterTabFileEdit',
  'workspaceOpen',
]);

/** Events whose handlers can return allow/deny/ask decisions — the gates. */
const GATE_EVENTS = ['beforeShellExecution', 'beforeMCPExecution', 'preToolUse', 'beforeReadFile'];
/** Events that observe results — the sensors. */
const FEEDBACK_EVENTS = ['afterFileEdit', 'postToolUse', 'afterShellExecution', 'stop', 'afterAgentResponse'];

interface HooksConfig {
  version?: unknown;
  hooks?: Record<string, Array<{ command?: unknown }>>;
}

function readHooksConfig(ctx: ScanContext): HooksConfig | null {
  const content = ctx.read(HOOKS_PATH);
  if (content === null) return null;
  const parsed = safeJsonParse(content);
  if (parsed === null || typeof parsed !== 'object') return null;
  return parsed as HooksConfig;
}

function eventNames(config: HooksConfig): string[] {
  return config.hooks && typeof config.hooks === 'object' ? Object.keys(config.hooks) : [];
}

export const hookChecks: Check[] = [
  {
    id: 'HKS-01',
    dimension: 'hooks',
    title: 'Hooks configuration present and valid JSON',
    points: 4,
    remediation:
      'Create .cursor/hooks.json ({"version": 1, "hooks": {…}}) — hooks are the only harness layer that can observe and control the agent loop deterministically.',
    run(ctx) {
      if (!ctx.has(HOOKS_PATH)) {
        return { passed: false, evidence: `No ${HOOKS_PATH} in repository.` };
      }
      const config = readHooksConfig(ctx);
      return config !== null
        ? { passed: true, evidence: `${HOOKS_PATH} parses as JSON.` }
        : { passed: false, evidence: `${HOOKS_PATH} exists but is not valid JSON.` };
    },
  },
  {
    id: 'HKS-02',
    dimension: 'hooks',
    title: 'Hooks use known events and a version field',
    points: 2,
    remediation:
      'Declare "version": 1 and register handlers only on documented events (beforeShellExecution, afterFileEdit, preToolUse, …) — typos in event names fail silently.',
    run(ctx) {
      const config = readHooksConfig(ctx);
      if (config === null) {
        return { passed: false, evidence: 'No parseable hooks configuration.' };
      }
      const events = eventNames(config);
      const unknown = events.filter((e) => !KNOWN_EVENTS.has(e));
      const passed = config.version !== undefined && events.length > 0 && unknown.length === 0;
      return {
        passed,
        evidence:
          events.length === 0
            ? 'hooks.json has no registered events.'
            : unknown.length > 0
              ? `Unknown event name(s): ${unknown.join(', ')}`
              : `version: ${String(config.version)}, events: ${events.join(', ')}.`,
      };
    },
  },
  {
    id: 'HKS-03',
    dimension: 'hooks',
    title: 'Gate hook guards risky operations',
    points: 4,
    remediation:
      'Register a hook on beforeShellExecution / beforeMCPExecution / preToolUse that returns allow/deny/ask — e.g. block destructive shell commands or scan for secrets before they execute.',
    run(ctx) {
      const config = readHooksConfig(ctx);
      if (config === null) {
        return { passed: false, evidence: 'No parseable hooks configuration.' };
      }
      const gates = eventNames(config).filter((e) => GATE_EVENTS.includes(e));
      return gates.length > 0
        ? { passed: true, evidence: `Gate hook(s) registered on: ${gates.join(', ')}.` }
        : { passed: false, evidence: `No hooks on gate events (${GATE_EVENTS.join(', ')}).` };
    },
  },
  {
    id: 'HKS-04',
    dimension: 'hooks',
    title: 'Feedback hook observes agent output',
    points: 2,
    remediation:
      'Register a hook on afterFileEdit / postToolUse / stop — e.g. auto-format edited files or run a quick lint so the agent sees failures immediately.',
    run(ctx) {
      const config = readHooksConfig(ctx);
      if (config === null) {
        return { passed: false, evidence: 'No parseable hooks configuration.' };
      }
      const feedback = eventNames(config).filter((e) => FEEDBACK_EVENTS.includes(e));
      return feedback.length > 0
        ? { passed: true, evidence: `Feedback hook(s) registered on: ${feedback.join(', ')}.` }
        : { passed: false, evidence: `No hooks on feedback events (${FEEDBACK_EVENTS.join(', ')}).` };
    },
  },
  {
    id: 'HKS-05',
    dimension: 'hooks',
    title: 'Hook scripts exist in the repository',
    points: 2,
    remediation:
      'Commit the scripts referenced by hooks.json (e.g. ./.cursor/hooks/guard.sh) — a hook pointing at a missing script fails open on every machine but yours.',
    run(ctx) {
      const config = readHooksConfig(ctx);
      if (config === null || !config.hooks) {
        return { passed: false, evidence: 'No parseable hooks configuration.' };
      }
      const commands: string[] = [];
      for (const handlers of Object.values(config.hooks)) {
        if (!Array.isArray(handlers)) continue;
        for (const handler of handlers) {
          if (handler && typeof handler.command === 'string') commands.push(handler.command);
        }
      }
      if (commands.length === 0) {
        return { passed: false, evidence: 'No hook commands declared.' };
      }
      // Only validate commands that reference an in-repo path; interpreter
      // invocations (node x, python x) are checked via their last path token.
      // Tokenizer is quote-aware (so a quoted path with spaces stays one
      // token); path tokens are normalized (quotes stripped, backslashes
      // converted to forward slashes) before resolving, since ScanContext
      // paths are always POSIX-style regardless of the hooks.json author's OS.
      const missing: string[] = [];
      let validated = 0;
      for (const command of commands) {
        const tokens = command.match(/"[^"]*"|'[^']*'|\S+/g) ?? [];
        const pathTokens = tokens.filter((t) => (t.includes('/') || t.includes('\\')) && !t.startsWith('-'));
        if (pathTokens.length === 0) continue;
        validated += 1;
        const resolvable = pathTokens.some((t) => {
          const unquoted = t.replace(/^["']|["']$/g, '');
          const normalized = unquoted.replace(/^\.[\\/]/, '').replace(/\\/g, '/');
          return ctx.has(normalized);
        });
        if (!resolvable) missing.push(command);
      }
      if (validated === 0) {
        return {
          passed: true,
          evidence: 'Hook commands do not reference in-repo paths (nothing to resolve).',
        };
      }
      return missing.length === 0
        ? {
            passed: true,
            evidence: `All ${validated} path-referencing hook command(s) resolve to committed files.`,
          }
        : { passed: false, evidence: `Hook command(s) reference missing files: ${missing.join(' | ')}` };
    },
  },
];
