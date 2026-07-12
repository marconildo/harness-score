import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { renderBadge, score } from '../dist/index.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(here, '..', 'dist', 'cli.js');
const FIXTURES = path.join(here, '..', '..', '..', 'fixtures');

function run(args: string[]) {
  return spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8' });
}

describe('cli', () => {
  test('--json emits a parseable report', () => {
    const result = run([path.join(FIXTURES, 'level-2'), '--json']);
    expect(result.status).toBe(0);
    const report = JSON.parse(result.stdout);
    expect(report.level.index).toBe(2);
  });

  test('--min-level gates with exit code 1', () => {
    const result = run([path.join(FIXTURES, 'level-1'), '--min-level', '3', '--quiet']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('below required L3');
  });

  test('--min-level passes when met', () => {
    const result = run([path.join(FIXTURES, 'level-4'), '--min-level', '4', '--quiet']);
    expect(result.status).toBe(0);
  });

  test('--badge writes a valid SVG', () => {
    const badgePath = path.join(os.tmpdir(), `hs-badge-${process.pid}.svg`);
    const result = run([path.join(FIXTURES, 'level-3'), '--badge', badgePath, '--quiet']);
    expect(result.status).toBe(0);
    const svg = fs.readFileSync(badgePath, 'utf8');
    expect(svg).toContain('<svg');
    expect(svg).toContain('Harness Score');
    expect(svg).toContain('L3');
    fs.unlinkSync(badgePath);
  });

  test('rejects a nonexistent directory', () => {
    const result = run([path.join(FIXTURES, 'does-not-exist')]);
    expect(result.status).toBe(2);
  });

  test('badge renderer escapes nothing unexpected', () => {
    const report = score(path.join(FIXTURES, 'level-0'));
    const svg = renderBadge(report);
    expect(svg).toContain('L0');
    expect(svg.startsWith('<svg')).toBe(true);
  });

  test('--diff compares against a baseline report and shows the level delta', () => {
    const baselinePath = path.join(os.tmpdir(), `hs-baseline-${process.pid}.json`);
    const baseline = run([path.join(FIXTURES, 'level-2'), '--json', '--quiet']);
    fs.writeFileSync(baselinePath, baseline.stdout, 'utf8');

    const result = run([path.join(FIXTURES, 'level-4'), '--diff', baselinePath]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Compared to baseline');
    expect(result.stdout).toContain('L2 · Guided → L4 · Self-correcting (+2)');

    const jsonResult = run([path.join(FIXTURES, 'level-4'), '--diff', baselinePath, '--json', '--quiet']);
    const payload = JSON.parse(jsonResult.stdout);
    expect(payload.diff.level.delta).toBe(2);
    expect(payload.current.level.index).toBe(4);
    expect(payload.baseline.level.index).toBe(2);

    fs.unlinkSync(baselinePath);
  });

  test('--diff fails clearly on an unreadable baseline path', () => {
    const result = run([
      path.join(FIXTURES, 'level-4'),
      '--diff',
      path.join(os.tmpdir(), 'does-not-exist.json'),
    ]);
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('--diff');
  });

  test('--diff fails clearly (not a crash) on a valid-JSON baseline that is not a Report', () => {
    const badPath = path.join(os.tmpdir(), `hs-bad-baseline-${process.pid}.json`);
    fs.writeFileSync(badPath, 'false', 'utf8');
    const result = run([path.join(FIXTURES, 'level-4'), '--diff', badPath]);
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('does not look like a harness-score report');
    fs.unlinkSync(badPath);
  });
});
