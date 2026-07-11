import type { Check, ScanContext } from '../types.js';
import { countHeadings, nonEmptyLines, parseFrontmatter, totalLines } from '../util.js';

const RULE_RE = /(^|\/)\.cursor\/rules\/[^/]+\.mdc$/;

function agentsFile(ctx: ScanContext): string | null {
  for (const candidate of ['AGENTS.md', 'CLAUDE.md']) {
    if (ctx.has(candidate)) return candidate;
  }
  return null;
}

export const contextChecks: Check[] = [
  {
    id: 'CTX-01',
    dimension: 'context',
    title: 'Agent context file present (AGENTS.md)',
    points: 4,
    remediation:
      'Create an AGENTS.md at the repository root describing what the project is, how to build/test it, and the conventions agents must follow.',
    run(ctx) {
      const file = agentsFile(ctx);
      return file
        ? { passed: true, evidence: `Found ${file} at repository root.` }
        : { passed: false, evidence: 'No AGENTS.md (or CLAUDE.md) at repository root.' };
    },
  },
  {
    id: 'CTX-02',
    dimension: 'context',
    title: 'Agent context file is substantive',
    points: 3,
    remediation:
      'Flesh out AGENTS.md: add sections for project overview, build & test commands, architecture, and conventions (aim for 20+ meaningful lines with headings).',
    run(ctx) {
      const file = agentsFile(ctx);
      const content = file ? ctx.read(file) : null;
      if (!file || content === null) {
        return { passed: false, evidence: 'No agent context file to evaluate.' };
      }
      const lines = nonEmptyLines(content);
      const headings = countHeadings(content);
      const passed = lines >= 20 && headings >= 2;
      return {
        passed,
        evidence: `${file}: ${lines} non-empty lines, ${headings} headings (needs ≥20 lines and ≥2 headings).`,
      };
    },
  },
  {
    id: 'CTX-03',
    dimension: 'context',
    title: 'Cursor rules directory in use',
    points: 4,
    remediation:
      "Add at least one rule under .cursor/rules/ as an .mdc file — start with a short always-on rule stating the project's non-negotiables.",
    run(ctx) {
      const rules = ctx.matching(RULE_RE);
      return rules.length > 0
        ? {
            passed: true,
            evidence: `Found ${rules.length} rule(s): ${rules.slice(0, 3).join(', ')}${rules.length > 3 ? ', …' : ''}`,
          }
        : { passed: false, evidence: 'No .mdc files under .cursor/rules/.' };
    },
  },
  {
    id: 'CTX-04',
    dimension: 'context',
    title: 'Rules have valid frontmatter',
    points: 3,
    remediation:
      'Give every .mdc rule a frontmatter block with a description and either alwaysApply: true or a globs: pattern so Cursor knows when to load it.',
    run(ctx) {
      const rules = ctx.matching(RULE_RE);
      if (rules.length === 0) {
        return { passed: false, evidence: 'No rules found to validate.' };
      }
      const invalid: string[] = [];
      for (const rule of rules) {
        const content = ctx.read(rule);
        const fm = content ? parseFrontmatter(content) : null;
        const ok =
          fm !== null &&
          (fm.description !== undefined || fm.alwaysApply !== undefined || fm.globs !== undefined);
        if (!ok) invalid.push(rule);
      }
      return invalid.length === 0
        ? {
            passed: true,
            evidence: `All ${rules.length} rule(s) declare frontmatter (description / alwaysApply / globs).`,
          }
        : {
            passed: false,
            evidence: `Rules missing usable frontmatter: ${invalid.slice(0, 3).join(', ')}${invalid.length > 3 ? ', …' : ''}`,
          };
    },
  },
  {
    id: 'CTX-05',
    dimension: 'context',
    title: 'Rules are scoped, not all always-on',
    points: 2,
    remediation:
      'Scope rules with globs: (e.g. "src/api/**") instead of making everything alwaysApply: true — always-on rules consume context on every request.',
    run(ctx) {
      const rules = ctx.matching(RULE_RE);
      if (rules.length === 0) {
        return { passed: false, evidence: 'No rules found.' };
      }
      let scoped = 0;
      let alwaysOn = 0;
      for (const rule of rules) {
        const content = ctx.read(rule);
        const fm = content ? parseFrontmatter(content) : null;
        if (!fm) continue;
        if (fm.globs) scoped += 1;
        else if ((fm.alwaysApply ?? '').toLowerCase() === 'true') alwaysOn += 1;
      }
      // A single always-on rule is fine; the anti-pattern is *everything* always-on.
      const passed = rules.length === 1 || scoped > 0 || alwaysOn < rules.length;
      return {
        passed,
        evidence: `${rules.length} rule(s): ${scoped} glob-scoped, ${alwaysOn} always-on.`,
      };
    },
  },
  {
    id: 'CTX-06',
    dimension: 'context',
    title: 'No bloated rules (≤500 lines each)',
    points: 2,
    remediation:
      'Split rules longer than 500 lines into focused, glob-scoped rules or move procedural content into a skill — huge rules crowd out task context.',
    run(ctx) {
      const rules = ctx.matching(RULE_RE);
      if (rules.length === 0) {
        return { passed: false, evidence: 'No rules found.' };
      }
      const bloated = rules.filter((r) => {
        const content = ctx.read(r);
        return content !== null && totalLines(content) > 500;
      });
      return bloated.length === 0
        ? { passed: true, evidence: `All ${rules.length} rule(s) are ≤500 lines.` }
        : { passed: false, evidence: `Oversized rules: ${bloated.join(', ')}` };
    },
  },
  {
    id: 'CTX-07',
    dimension: 'context',
    title: 'README present',
    points: 1,
    remediation: 'Add a README.md — agents (and humans) use it as the first orientation document.',
    run(ctx) {
      return ctx.has('README.md')
        ? { passed: true, evidence: 'README.md found at repository root.' }
        : { passed: false, evidence: 'No README.md at repository root.' };
    },
  },
  {
    id: 'CTX-08',
    dimension: 'context',
    title: 'No legacy .cursorrules file',
    points: 1,
    remediation:
      'Migrate the legacy .cursorrules file to .cursor/rules/*.mdc (scoped rules with frontmatter) — .cursorrules is deprecated.',
    run(ctx) {
      return ctx.has('.cursorrules')
        ? { passed: false, evidence: 'Legacy .cursorrules file found at repository root.' }
        : { passed: true, evidence: 'No deprecated .cursorrules file.' };
    },
  },
];
