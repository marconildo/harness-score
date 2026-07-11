import type { Report } from '../types.js';

const useColor = process.stdout.isTTY === true && process.env.NO_COLOR === undefined;

const paint = (code: string) => (text: string) => (useColor ? `[${code}m${text}[0m` : text);
const bold = paint('1');
const dim = paint('2');
const red = paint('31');
const green = paint('32');
const yellow = paint('33');
const cyan = paint('36');

const LEVEL_COLOR = [red, yellow, yellow, green, green];

function bar(percent: number, width = 20): string {
  const filled = Math.round((percent / 100) * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

export function renderTerminal(report: Report): string {
  const lines: string[] = [];
  const levelPaint = LEVEL_COLOR[report.level.index] ?? red;
  lines.push('');
  lines.push(bold(`  harness-score v${report.tool.version}`) + dim(`  ${report.root}`));
  lines.push('');
  lines.push(
    `  ${bold('Maturity:')} ${levelPaint(bold(`L${report.level.index} · ${report.level.name}`))}` +
      `   ${bold('Score:')} ${report.score.earned}/${report.score.max} (${report.score.percent}%)`,
  );
  lines.push('');
  for (const dimension of report.dimensions) {
    const pct = `${dimension.percent}%`.padStart(4);
    lines.push(
      `  ${dimension.title.padEnd(20)} ${bar(dimension.percent)} ${pct}  ${dim(`${dimension.earned}/${dimension.max} pts`)}`,
    );
  }
  lines.push('');

  const failed = report.checks.filter((c) => !c.passed);
  if (failed.length === 0) {
    lines.push(green('  All checks passed — this repository is fully harnessed. 🏆'));
  } else {
    lines.push(bold(`  Improvements (${failed.length}):`));
    for (const check of failed) {
      lines.push(`   ${red('✗')} ${bold(check.id)} ${check.title} ${dim(`(+${check.points} pts)`)}`);
      lines.push(`     ${check.remediation}`);
      lines.push(`     ${dim(check.evidence)}`);
      lines.push(`     ${cyan(check.docsUrl)}`);
    }
  }
  lines.push('');
  if (report.level.nextLevelGaps.length > 0) {
    lines.push(`  ${bold(`To reach L${report.level.index + 1}:`)} ${report.level.nextLevelGaps.join('; ')}`);
    lines.push('');
  }
  return lines.join('\n');
}
