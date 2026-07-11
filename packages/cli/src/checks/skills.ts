import type { Check, ScanContext } from '../types.js';
import { parseFrontmatter } from '../util.js';

const SKILL_RE = /(^|\/)\.(cursor|agents)\/skills\/[^/]+\/SKILL\.md$/;
const COMMAND_RE = /(^|\/)\.cursor\/commands\/[^/]+\.md$/;

function skillFiles(ctx: ScanContext): string[] {
  return ctx.matching(SKILL_RE);
}

export const skillChecks: Check[] = [
  {
    id: 'SKL-01',
    dimension: 'skills',
    title: 'At least one agent skill defined',
    points: 4,
    remediation:
      'Create .cursor/skills/<skill-name>/SKILL.md packaging a procedural workflow the agent should follow on demand (deploys, releases, migrations…).',
    run(ctx) {
      const skills = skillFiles(ctx);
      return skills.length > 0
        ? {
            passed: true,
            evidence: `Found ${skills.length} skill(s): ${skills.slice(0, 3).join(', ')}${skills.length > 3 ? ', …' : ''}`,
          }
        : { passed: false, evidence: 'No SKILL.md under .cursor/skills/ or .agents/skills/.' };
    },
  },
  {
    id: 'SKL-02',
    dimension: 'skills',
    title: 'Skills declare name and description',
    points: 3,
    remediation:
      'Add frontmatter with name: and description: to every SKILL.md — the agent decides whether to load a skill from those two fields alone.',
    run(ctx) {
      const skills = skillFiles(ctx);
      if (skills.length === 0) {
        return { passed: false, evidence: 'No skills found to validate.' };
      }
      const invalid = skills.filter((s) => {
        const content = ctx.read(s);
        const fm = content ? parseFrontmatter(content) : null;
        return !(fm?.name && fm.description);
      });
      return invalid.length === 0
        ? { passed: true, evidence: `All ${skills.length} skill(s) declare name and description.` }
        : { passed: false, evidence: `Skills missing name/description frontmatter: ${invalid.join(', ')}` };
    },
  },
  {
    id: 'SKL-03',
    dimension: 'skills',
    title: 'Slash commands defined',
    points: 3,
    remediation:
      'Add markdown files under .cursor/commands/ for workflows you trigger intentionally (e.g. /release, /review) — commands are explicit, repeatable entry points.',
    run(ctx) {
      const commands = ctx.matching(COMMAND_RE);
      return commands.length > 0
        ? {
            passed: true,
            evidence: `Found ${commands.length} command(s): ${commands.slice(0, 3).join(', ')}${commands.length > 3 ? ', …' : ''}`,
          }
        : { passed: false, evidence: 'No markdown files under .cursor/commands/.' };
    },
  },
  {
    id: 'SKL-04',
    dimension: 'skills',
    title: 'Skill descriptions are trigger-worthy',
    points: 2,
    remediation:
      'Write skill descriptions of 40+ characters that say when to use the skill ("Use when…"), not just what it is — vague descriptions never trigger.',
    run(ctx) {
      const skills = skillFiles(ctx);
      if (skills.length === 0) {
        return { passed: false, evidence: 'No skills found.' };
      }
      const weak = skills.filter((s) => {
        const content = ctx.read(s);
        const fm = content ? parseFrontmatter(content) : null;
        return !(fm && (fm.description ?? '').length >= 40);
      });
      return weak.length === 0
        ? { passed: true, evidence: `All ${skills.length} skill description(s) are ≥40 characters.` }
        : { passed: false, evidence: `Skills with short/missing descriptions: ${weak.join(', ')}` };
    },
  },
];
