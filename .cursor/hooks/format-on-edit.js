// Feedback hook: formats files the agent just edited so diffs stay clean.
// Best-effort by design — never blocks the edit.
import { execFileSync } from 'node:child_process';

let input = '';
process.stdin.on('data', (chunk) => (input += chunk));
process.stdin.on('end', () => {
  try {
    const payload = JSON.parse(input || '{}');
    const filePath = payload.file_path ?? payload.filePath;
    if (typeof filePath === 'string' && /\.(ts|js|mjs|json|jsonc)$/.test(filePath)) {
      execFileSync('npx', ['-y', '@biomejs/biome', 'format', '--write', filePath], {
        stdio: 'ignore',
        shell: process.platform === 'win32',
      });
    }
  } catch {
    // Formatting is advisory; the edit stands either way.
  }
  process.stdout.write(JSON.stringify({}));
});
