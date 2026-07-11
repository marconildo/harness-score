import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { score } from '../dist/index.js';

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'fixtures');

describe('maturity levels on fixture repositories', () => {
  test.each([
    ['level-0', 0],
    ['level-1', 1],
    ['level-2', 2],
    ['level-3', 3],
    ['level-4', 4],
  ])('%s scores L%i', (fixture, expected) => {
    const report = score(path.join(FIXTURES, fixture));
    expect(report.level.index, JSON.stringify(report.level, null, 2)).toBe(expected);
  });

  test('report shape is stable', () => {
    const report = score(path.join(FIXTURES, 'level-4'));
    expect(report.tool.name).toBe('harness-score');
    expect(report.score.max).toBe(100);
    expect(report.dimensions).toHaveLength(6);
    for (const check of report.checks) {
      expect(check.id).toMatch(/^[A-Z]{2,3}-\d{2}$/);
      expect(check.docsUrl).toContain(`#${check.id.toLowerCase()}`);
      expect(typeof check.evidence).toBe('string');
      expect(check.evidence.length).toBeGreaterThan(0);
    }
  });

  test('level-4 fixture earns a high score', () => {
    const report = score(path.join(FIXTURES, 'level-4'));
    expect(report.score.percent).toBeGreaterThanOrEqual(90);
    expect(report.level.nextLevelGaps).toHaveLength(0);
  });

  test('level gaps explain what is missing', () => {
    const report = score(path.join(FIXTURES, 'level-3'));
    expect(report.level.nextLevelGaps.join(' ')).toContain('hooks');
  });
});
