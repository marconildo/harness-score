import type { Check, ScanContext } from '../types.js';
import { parseFrontmatter } from '../util.js';

const AGENT_RE = /(^|\/)\.cursor\/agents\/[^/]+\.md$/;

function agentFiles(ctx: ScanContext): string[] {
  return ctx.matching(AGENT_RE);
}

export const agentChecks: Check[] = [
  {
    id: 'AGT-01',
    dimension: 'skills',
    title: 'Custom subagent defined',
    points: 3,
    remediation:
      'Create .cursor/agents/<agent-name>.md defining a purpose-built subagent the primary agent can delegate to for a specific job (planning, review, release…).',
    run(ctx) {
      const agents = agentFiles(ctx);
      return agents.length > 0
        ? {
            passed: true,
            evidence: `Found ${agents.length} subagent(s): ${agents.slice(0, 3).join(', ')}${agents.length > 3 ? ', …' : ''}`,
          }
        : { passed: false, evidence: 'No markdown files under .cursor/agents/.' };
    },
  },
  {
    id: 'AGT-02',
    dimension: 'skills',
    title: 'Subagents declare name and description',
    points: 2,
    remediation:
      'Add frontmatter with name: and description: to every subagent definition — the parent agent decides whether to delegate from those two fields alone.',
    run(ctx) {
      const agents = agentFiles(ctx);
      if (agents.length === 0) {
        return { passed: false, evidence: 'No subagents found to validate.' };
      }
      const invalid = agents.filter((a) => {
        const content = ctx.read(a);
        const fm = content ? parseFrontmatter(content) : null;
        return !(fm?.name && fm.description);
      });
      return invalid.length === 0
        ? { passed: true, evidence: `All ${agents.length} subagent(s) declare name and description.` }
        : {
            passed: false,
            evidence: `Subagents missing name/description frontmatter: ${invalid.join(', ')}`,
          };
    },
  },
];
