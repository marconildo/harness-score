import type { Report } from '../types.js';

const LEVEL_BADGE_COLOR = ['#e05d44', '#fe7d37', '#dfb317', '#97ca00', '#4c1'];

/** Approximate Verdana 11px width the way shields.io does. */
function textWidth(text: string): number {
  let width = 0;
  for (const char of text) {
    width += /[mwMW]/.test(char) ? 10 : /[il1.:· ]/.test(char) ? 4 : 7;
  }
  return width;
}

/**
 * Deterministic flat-style SVG badge, self-contained (no network, no
 * shields.io dependency): `harness score | L3 · Sensing 72%`.
 */
export function renderBadge(report: Report): string {
  const label = 'harness score';
  const value = `L${report.level.index} · ${report.level.name} ${report.score.percent}%`;
  const color = LEVEL_BADGE_COLOR[report.level.index] ?? LEVEL_BADGE_COLOR[0];
  const labelWidth = textWidth(label) + 12;
  const valueWidth = textWidth(value) + 12;
  const total = labelWidth + valueWidth;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${total}" height="20" role="img" aria-label="${label}: ${value}">
  <title>${label}: ${value}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r"><rect width="${total}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="20" fill="#555"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="20" fill="${color}"/>
    <rect width="${total}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="${labelWidth / 2}" y="14">${label}</text>
    <text x="${labelWidth + valueWidth / 2}" y="14">${value}</text>
  </g>
</svg>
`;
}
