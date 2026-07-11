/**
 * Minimal frontmatter parser: reads the leading `---` block and extracts
 * top-level `key: value` pairs. Intentionally supports only the flat subset
 * used by Cursor rules (.mdc) and skills (SKILL.md) — determinism over power.
 */
export function parseFrontmatter(content: string): Record<string, string> | null {
  const normalized = content.replace(/^﻿/, '');
  const match = normalized.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/);
  if (!match) return null;
  const result: Record<string, string> = {};
  for (const line of match[1]!.split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
    if (kv) {
      result[kv[1]!] = kv[2]!.trim().replace(/^["']|["']$/g, '');
    }
  }
  return result;
}

/** Count lines that contain something other than whitespace. */
export function nonEmptyLines(content: string): number {
  return content.split(/\r?\n/).filter((l) => l.trim().length > 0).length;
}

export function totalLines(content: string): number {
  return content.split(/\r?\n/).length;
}

/** Markdown headings (`#`–`######`). */
export function countHeadings(content: string): number {
  return content.split(/\r?\n/).filter((l) => /^#{1,6}\s+\S/.test(l)).length;
}

/**
 * Signatures of credentials that must never live in a repository.
 * Applied to harness files (mcp.json, rules, AGENTS.md) — not a full secret
 * scanner, but catches the classic leaks deterministically.
 */
const SECRET_PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: 'OpenAI-style API key', re: /\bsk-[A-Za-z0-9_-]{20,}\b/ },
  { name: 'Anthropic API key', re: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/ },
  { name: 'GitHub token', re: /\bgh[pousr]_[A-Za-z0-9]{30,}\b/ },
  { name: 'GitHub fine-grained PAT', re: /\bgithub_pat_[A-Za-z0-9_]{30,}\b/ },
  { name: 'AWS access key id', re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'Slack token', re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ },
  { name: 'Private key block', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
];

export function findSecret(content: string): string | null {
  for (const { name, re } of SECRET_PATTERNS) {
    if (re.test(content)) return name;
  }
  return null;
}

export function safeJsonParse(content: string): unknown | null {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}
