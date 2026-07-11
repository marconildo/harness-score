import type { Report } from '../types.js';

export function renderMarkdown(report: Report): string {
  const lines: string[] = [];
  lines.push(`# Harness Score Report`);
  lines.push('');
  lines.push(`**Maturity level:** L${report.level.index} · ${report.level.name}`);
  lines.push(`**Score:** ${report.score.earned}/${report.score.max} (${report.score.percent}%)`);
  lines.push('');
  lines.push('## Dimensions');
  lines.push('');
  lines.push('| Dimension | Score | % |');
  lines.push('|---|---|---|');
  for (const dimension of report.dimensions) {
    lines.push(`| ${dimension.title} | ${dimension.earned}/${dimension.max} | ${dimension.percent}% |`);
  }
  lines.push('');
  lines.push('## Checks');
  lines.push('');
  lines.push('| | Check | Points | Evidence |');
  lines.push('|---|---|---|---|');
  for (const check of report.checks) {
    const status = check.passed ? '✅' : '❌';
    lines.push(
      `| ${status} | [${check.id}](${check.docsUrl}) ${check.title} | ${check.earned}/${check.points} | ${check.evidence.replace(/\|/g, '\\|')} |`,
    );
  }
  const failed = report.checks.filter((c) => !c.passed);
  if (failed.length > 0) {
    lines.push('');
    lines.push('## Recommended improvements');
    lines.push('');
    for (const check of failed) {
      lines.push(`- **${check.id}** — ${check.remediation} ([guide](${check.docsUrl}))`);
    }
  }
  if (report.level.nextLevelGaps.length > 0) {
    lines.push('');
    lines.push(`**To reach L${report.level.index + 1}:** ${report.level.nextLevelGaps.join('; ')}`);
  }
  lines.push('');
  return lines.join('\n');
}
