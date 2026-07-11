import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Harness Score',
  description:
    'The harness engineering guide for Cursor — and a deterministic scanner that measures how well-harnessed your repository is.',
  base: '/harness-score/',
  lastUpdated: true,
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/harness-score/favicon.svg' }]],
  themeConfig: {
    logo: '/logo.svg',
    nav: [
      { text: 'Guide', link: '/guide/what-is-harness-engineering' },
      { text: 'Maturity Model', link: '/guide/maturity-model' },
      { text: 'Scanner', link: '/guide/measure-and-improve' },
    ],
    sidebar: [
      {
        text: 'The Guide',
        items: [
          { text: '1 · What is Harness Engineering', link: '/guide/what-is-harness-engineering' },
          { text: '2 · The Cursor Harness Surface', link: '/guide/cursor-harness-surface' },
          { text: '3 · Guides — Feedforward', link: '/guide/guides-feedforward' },
          { text: '4 · Sensors — Feedback', link: '/guide/sensors-feedback' },
          { text: '5 · Guardrails & Safety', link: '/guide/guardrails-and-safety' },
          { text: '6 · The Maturity Model', link: '/guide/maturity-model' },
          { text: '7 · Measure & Improve', link: '/guide/measure-and-improve' },
          { text: '8 · References', link: '/guide/references' },
        ],
      },
    ],
    socialLinks: [{ icon: 'github', link: 'https://github.com/paladini/harness-score' }],
    search: { provider: 'local' },
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 Fernando Paladini',
    },
    outline: { level: [2, 3] },
  },
});
