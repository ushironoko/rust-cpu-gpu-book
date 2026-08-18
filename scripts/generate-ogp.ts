// OGP画像(1200x630)を satori + resvg で生成する。
// 実行: bun run scripts/generate-ogp.ts
// フォント: scripts/.cache/ に Noto Sans JP (woff) を配置しておく
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFile, writeFile } from 'node:fs/promises';
import type { ReactElement } from 'react';

const C = {
  bg: '#12141d',
  panel: '#1c1f2c',
  panelBorder: '#2c3044',
  text: '#f2f3f8',
  sub: '#a7aec2',
  dim: '#697089',
  indigo: '#8b93ff',
  indigoDeep: '#4c56d8',
  orange: '#e5a458',
};

// JSXを使わずにReact要素と構造互換のオブジェクトを組み立てる
// (satoriのドキュメントにある "Use without JSX" の形)
const h = (
  type: string,
  style: Record<string, unknown>,
  ...children: (ReactElement | string)[]
): ReactElement => {
  if (children.length > 1 && style['display'] !== 'flex') {
    throw new Error(`display:flex がない複数子ノード: ${JSON.stringify(style)}`);
  }
  // 注意: children を空配列で渡すと satori が「複数子ノード」と誤認して
  // display:flex を要求するため、子が無い場合はキー自体を省略する
  return {
    type,
    props: children.length > 0 ? { style, children } : { style },
    key: null,
  };
};

const root = h(
  'div',
  {
    width: 1200,
    height: 630,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    background: `linear-gradient(135deg, ${C.bg} 0%, #171a28 60%, #1b1430 100%)`,
    color: C.text,
    fontFamily: 'Noto Sans JP',
    padding: 80,
    gap: 36,
  },
  h(
    'div',
    {
      display: 'flex',
      flexDirection: 'column',
      fontSize: 92,
      fontWeight: 700,
      lineHeight: 1.3,
    },
    h('div', { display: 'flex' }, 'Rustではじめる'),
    h('div', { display: 'flex', color: C.indigo }, 'CPUとGPU')
  ),
  h(
    'div',
    { display: 'flex', fontSize: 34, color: C.sub },
    '実測でたどる、計算機の仕組みと最適化の教科書'
  ),
  h(
    'div',
    { display: 'flex', fontSize: 26, color: C.dim, marginTop: 20 },
    'rust-cpu-gpu-book.void.app'
  )
);

async function main(): Promise<void> {
  const [bold, regular] = await Promise.all([
    readFile('scripts/.cache/noto-jp-700.woff'),
    readFile('scripts/.cache/noto-jp-400.woff'),
  ]);

  const svg = await satori(root, {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Noto Sans JP', data: bold, weight: 700, style: 'normal' },
      { name: 'Noto Sans JP', data: regular, weight: 400, style: 'normal' },
    ],
  });

  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } })
    .render()
    .asPng();
  await writeFile('public/ogp.png', png);
  console.log(`public/ogp.png (${(png.length / 1024).toFixed(0)}KB)`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
