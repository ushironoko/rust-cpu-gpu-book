// docs/ の frontmatter (sidebar.label / title) から ox-content の
// テーマ sidebar 構成を生成する。グループ構成は旧 astro.config.mjs の
// sidebar 定義と同一。順序はファイル名の数字プレフィックスに従う。
import { globSync, readFileSync } from 'node:fs';

const GROUPS = [
  { text: 'Part I: CPUを知る', dir: 'cpu' },
  { text: 'Part II: Rustと最適化', dir: 'rust-opt' },
  { text: 'Part III: GPUを知る', dir: 'gpu' },
  { text: 'Part IV: CPUとメモリの深層', dir: 'cpu-deep' },
  { text: 'Part V: Rustの深層', dir: 'rust-deep' },
  { text: 'Part VI: GPUの深層', dir: 'gpu-deep' },
  { text: 'Part VII: システムと実践', dir: 'systems' },
  { text: '付録', dir: 'appendix' },
];

function frontmatterOf(file) {
  const src = readFileSync(file, 'utf8');
  const m = src.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const fm = {};
  const title = m[1].match(/^title:\s*(.+)$/m);
  if (title) fm.title = title[1].trim().replace(/^['"]|['"]$/g, '');
  const label = m[1].match(/^sidebar:\n\s+label:\s*(.+)$/m);
  if (label) fm.label = label[1].trim().replace(/^['"]|['"]$/g, '');
  return fm;
}

export function buildSidebar() {
  const sidebar = [
    { text: 'はじめに', items: [{ text: 'はじめに', link: '/index.md' }] },
  ];
  for (const group of GROUPS) {
    const files = globSync(`docs/${group.dir}/*.md`).sort();
    sidebar.push({
      text: group.text,
      items: files.map((file) => {
        const fm = frontmatterOf(file);
        return {
          text: fm.label ?? fm.title ?? file,
          link: file.replace(/^docs/, '').replace(/\\/g, '/'),
        };
      }),
    });
  }
  return sidebar;
}
