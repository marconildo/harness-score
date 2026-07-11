import type { Report } from '../types.js';

/** Fixed layout — every badge is the same size; text never scales by level. */
const H = 30;
const LABEL_SEG = 102;
const VALUE_SEG = 188; // fits "L4 · Self-correcting 100%" at 15px
const TOTAL = LABEL_SEG + VALUE_SEG;
const LABEL_X = 38;
const VALUE_X = LABEL_SEG + 12;
const FONT = 'Verdana,Geneva,DejaVu Sans,sans-serif';
const FONT_SIZE = 15;

/**
 * Deterministic, self-contained SVG maturity badge in the harness-score brand
 * (graphite tile + ascending emerald bars). Fixed width so every level renders
 * at the same font size — no shields.io, no paid service.
 */
export function renderBadge(report: Report): string {
  const label = 'harness';
  const value = `L${report.level.index} · ${report.level.name} ${report.score.percent}%`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${TOTAL}" height="${H}" viewBox="0 0 ${TOTAL} ${H}" fill="none" role="img" aria-label="Harness Score ${value}">
  <title>Harness Score — ${value}</title>
  <defs>
    <linearGradient id="hs-fill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3ce3a3"/>
      <stop offset="1" stop-color="#16a877"/>
    </linearGradient>
    <clipPath id="hs-badge"><rect width="${TOTAL}" height="${H}" rx="6"/></clipPath>
  </defs>
  <g clip-path="url(#hs-badge)">
    <rect width="${LABEL_SEG}" height="${H}" fill="#14232f"/>
    <rect x="${LABEL_SEG}" width="${VALUE_SEG}" height="${H}" fill="#16a877"/>
    <rect x="12" y="13" width="4" height="8" rx="2" fill="url(#hs-fill)"/>
    <rect x="19" y="9" width="4" height="12" rx="2" fill="url(#hs-fill)"/>
    <rect x="26" y="5" width="4" height="16" rx="2" fill="url(#hs-fill)"/>
    <text x="${LABEL_X}" y="20" font-family="${FONT}" font-size="${FONT_SIZE}" font-weight="600" fill="#e9f2ee">${label}</text>
    <text x="${VALUE_X}" y="20" font-family="${FONT}" font-size="${FONT_SIZE}" font-weight="700" fill="#06231a">${value}</text>
  </g>
</svg>
`;
}
