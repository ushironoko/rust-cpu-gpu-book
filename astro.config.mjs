// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import mermaid from 'astro-mermaid';

export default defineConfig({
  site: 'https://rust-cpu-gpu-book.void.app',
  integrations: [
    // astro-mermaid は markdown 処理系より先に登録する
    mermaid({ autoTheme: true }),
    starlight({
      title: 'RustではじめるCPUとGPU',
      description:
        'Webアプリケーション開発者のための、RustでたどるCPU・GPUの教科書',
      defaultLocale: 'root',
      locales: {
        root: { label: '日本語', lang: 'ja' },
      },
      customCss: ['./src/styles/custom.css'],
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
      sidebar: [
        { label: 'はじめに', link: '/' },
        {
          label: 'Part I — CPUを知る',
          items: [{ autogenerate: { directory: 'cpu' } }],
        },
        {
          label: 'Part II — Rustと最適化',
          items: [{ autogenerate: { directory: 'rust-opt' } }],
        },
        {
          label: 'Part III — GPUを知る',
          items: [{ autogenerate: { directory: 'gpu' } }],
        },
        {
          label: 'Part IV — CPUとメモリの深層',
          items: [{ autogenerate: { directory: 'cpu-deep' } }],
        },
        {
          label: 'Part V — Rustの深層',
          items: [{ autogenerate: { directory: 'rust-deep' } }],
        },
        {
          label: 'Part VI — GPUの深層',
          items: [{ autogenerate: { directory: 'gpu-deep' } }],
        },
        {
          label: 'Part VII — システムと実践',
          items: [{ autogenerate: { directory: 'systems' } }],
        },
        { label: '付録', items: [{ autogenerate: { directory: 'appendix' } }] },
      ],
    }),
  ],
});
