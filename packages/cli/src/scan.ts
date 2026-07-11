import * as fs from 'node:fs';
import * as path from 'node:path';
import type { ScanContext } from './types.js';

/** Directories that never contain harness signal and can be huge. */
const SKIP_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  'out',
  'coverage',
  'target',
  'vendor',
  '__pycache__',
  '.venv',
  'venv',
  '.tox',
  '.next',
  '.nuxt',
  '.cache',
  '.turbo',
  '.idea',
]);

const MAX_DEPTH = 10;
const MAX_FILES = 20000;
/** Never read file bodies larger than this (binary/artifact protection). */
const MAX_READ_BYTES = 512 * 1024;

function walk(root: string): string[] {
  const files: string[] = [];
  const stack: Array<{ abs: string; rel: string; depth: number }> = [{ abs: root, rel: '', depth: 0 }];
  while (stack.length > 0) {
    const dir = stack.pop()!;
    if (dir.depth > MAX_DEPTH || files.length >= MAX_FILES) continue;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir.abs, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const rel = dir.rel === '' ? entry.name : `${dir.rel}/${entry.name}`;
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) {
          stack.push({ abs: path.join(dir.abs, entry.name), rel, depth: dir.depth + 1 });
        }
      } else if (entry.isFile()) {
        files.push(rel);
        if (files.length >= MAX_FILES) break;
      }
    }
  }
  files.sort();
  return files;
}

export function createScanContext(rootInput: string): ScanContext {
  const root = path.resolve(rootInput);
  const files = walk(root);
  const fileSet = new Set(files);
  const contentCache = new Map<string, string | null>();

  return {
    root,
    files,
    has(relPath: string): boolean {
      return fileSet.has(relPath);
    },
    read(relPath: string): string | null {
      if (contentCache.has(relPath)) return contentCache.get(relPath)!;
      let content: string | null = null;
      if (fileSet.has(relPath)) {
        try {
          const abs = path.join(root, relPath);
          const stat = fs.statSync(abs);
          if (stat.size <= MAX_READ_BYTES) {
            content = fs.readFileSync(abs, 'utf8');
          }
        } catch {
          content = null;
        }
      }
      contentCache.set(relPath, content);
      return content;
    },
    matching(re: RegExp): string[] {
      return files.filter((f) => re.test(f));
    },
  };
}
