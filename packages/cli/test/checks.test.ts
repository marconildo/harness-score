import { describe, expect, test } from 'vitest';
import { check, fakeContext } from './helpers.js';

describe('context checks', () => {
  test('CTX-02 fails on a thin AGENTS.md', async () => {
    const ctx = fakeContext({ 'AGENTS.md': '# Hi\nuse good code\n' });
    expect((await check('CTX-02')).run(ctx).passed).toBe(false);
  });

  test('CTX-04 rejects rules without frontmatter', async () => {
    const ctx = fakeContext({ '.cursor/rules/naked.mdc': 'Just some prose, no frontmatter.' });
    expect((await check('CTX-04')).run(ctx).passed).toBe(false);
  });

  test('CTX-06 flags a 600-line rule', async () => {
    const ctx = fakeContext({
      '.cursor/rules/huge.mdc': `---\ndescription: x\n---\n${'line\n'.repeat(600)}`,
    });
    expect((await check('CTX-06')).run(ctx).passed).toBe(false);
  });

  test('CTX-08 flags legacy .cursorrules', async () => {
    const ctx = fakeContext({ '.cursorrules': 'old style' });
    expect((await check('CTX-08')).run(ctx).passed).toBe(false);
  });
});

describe('hook checks', () => {
  test('HKS-01 fails on invalid JSON', async () => {
    const ctx = fakeContext({ '.cursor/hooks.json': '{ not json' });
    expect((await check('HKS-01')).run(ctx).passed).toBe(false);
  });

  test('HKS-02 flags unknown event names', async () => {
    const ctx = fakeContext({
      '.cursor/hooks.json': JSON.stringify({ version: 1, hooks: { onFileSave: [{ command: 'x' }] } }),
    });
    const outcome = (await check('HKS-02')).run(ctx);
    expect(outcome.passed).toBe(false);
    expect(outcome.evidence).toContain('onFileSave');
  });

  test('HKS-05 flags hook scripts that do not exist', async () => {
    const ctx = fakeContext({
      '.cursor/hooks.json': JSON.stringify({
        version: 1,
        hooks: { beforeShellExecution: [{ command: './.cursor/hooks/missing.sh' }] },
      }),
    });
    expect((await check('HKS-05')).run(ctx).passed).toBe(false);
  });

  test('HKS-05 resolves backslash-style Windows paths when the script exists', async () => {
    const ctx = fakeContext({
      '.cursor/hooks.json': JSON.stringify({
        version: 1,
        hooks: { beforeShellExecution: [{ command: 'node .cursor\\hooks\\guard.js' }] },
      }),
      '.cursor/hooks/guard.js': '// present',
    });
    expect((await check('HKS-05')).run(ctx).passed).toBe(true);
  });

  test('HKS-05 flags backslash-style paths when the script is actually missing', async () => {
    const ctx = fakeContext({
      '.cursor/hooks.json': JSON.stringify({
        version: 1,
        hooks: { beforeShellExecution: [{ command: 'node .cursor\\hooks\\missing.js' }] },
      }),
    });
    expect((await check('HKS-05')).run(ctx).passed).toBe(false);
  });

  test('HKS-05 resolves a quoted path with trailing arguments', async () => {
    const ctx = fakeContext({
      '.cursor/hooks.json': JSON.stringify({
        version: 1,
        hooks: { beforeShellExecution: [{ command: '"./.cursor/hooks/guard.sh" --arg' }] },
      }),
      '.cursor/hooks/guard.sh': '#!/bin/sh',
    });
    expect((await check('HKS-05')).run(ctx).passed).toBe(true);
  });
});

describe('ci checks', () => {
  test('CI-02 recognizes turbo/nx/pnpm-filter monorepo test invocations', async () => {
    const turbo = fakeContext({ '.github/workflows/ci.yml': 'run: turbo run test' });
    expect((await check('CI-02')).run(turbo).passed).toBe(true);

    const pnpmFilter = fakeContext({ '.github/workflows/ci.yml': 'run: pnpm --filter api test' });
    expect((await check('CI-02')).run(pnpmFilter).passed).toBe(true);
  });

  test('CI-02 does not match "test" inside unrelated words', async () => {
    const ctx = fakeContext({ '.github/workflows/ci.yml': 'run: echo "latest build attestation"' });
    expect((await check('CI-02')).run(ctx).passed).toBe(false);
  });
});

describe('hygiene checks', () => {
  test('HYG-03 fails on an unignored .env', async () => {
    const ctx = fakeContext({ '.env': 'API_KEY=oops', '.gitignore': 'node_modules/\n' });
    expect((await check('HYG-03')).run(ctx).passed).toBe(false);
  });

  test('HYG-03 accepts .env.example', async () => {
    const ctx = fakeContext({ '.env.example': 'API_KEY=' });
    expect((await check('HYG-03')).run(ctx).passed).toBe(true);
  });

  test('HYG-04 detects an inlined API key in mcp.json', async () => {
    const ctx = fakeContext({
      '.cursor/mcp.json': JSON.stringify({
        mcpServers: { svc: { env: { API_KEY: 'sk-abcdefghijklmnopqrstuvwx1234' } } },
      }),
    });
    const outcome = (await check('HYG-04')).run(ctx);
    expect(outcome.passed).toBe(false);
  });

  test('HYG-04 accepts env interpolation', async () => {
    const ctx = fakeContext({
      '.cursor/mcp.json': JSON.stringify({
        mcpServers: { svc: { env: { API_KEY: '${MY_API_KEY}' } } },
      }),
    });
    expect((await check('HYG-04')).run(ctx).passed).toBe(true);
  });
});

describe('sensor checks', () => {
  test('SNS-01 ignores npm default placeholder test script', async () => {
    const ctx = fakeContext({
      'package.json': JSON.stringify({ scripts: { test: 'echo "Error: no test specified" && exit 1' } }),
    });
    expect((await check('SNS-01')).run(ctx).passed).toBe(false);
  });

  test('SNS-03 auto-passes statically typed ecosystems', async () => {
    const ctx = fakeContext({ 'go.mod': 'module example.com/app\n' });
    const outcome = (await check('SNS-03')).run(ctx);
    expect(outcome.passed).toBe(true);
    expect(outcome.evidence).toContain('go');
  });
});
