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

// CPUダイ: 大きな制御+演算のコア4つ + キャッシュ
const cpuDie = () =>
  h(
    'div',
    {
      display: 'flex',
      flexDirection: 'column',
      background: C.panel,
      border: `2px solid ${C.panelBorder}`,
      borderRadius: 18,
      padding: 20,
      gap: 12,
      width: 420,
    },
    h(
      'div',
      { display: 'flex', gap: 12 },
      ...[0, 1].map(() =>
        h(
          'div',
          { display: 'flex', gap: 8, flex: 1 },
          h('div', {
            width: 76,
            height: 74,
            background: `${C.orange}33`,
            border: `2px solid ${C.orange}`,
            borderRadius: 8,
          }),
          h('div', {
            flex: 1,
            height: 74,
            background: `${C.indigo}2e`,
            border: `2px solid ${C.indigo}`,
            borderRadius: 8,
          })
        )
      )
    ),
    h(
      'div',
      { display: 'flex', gap: 12 },
      ...[0, 1].map(() =>
        h(
          'div',
          { display: 'flex', gap: 8, flex: 1 },
          h('div', {
            width: 76,
            height: 74,
            background: `${C.orange}33`,
            border: `2px solid ${C.orange}`,
            borderRadius: 8,
          }),
          h('div', {
            flex: 1,
            height: 74,
            background: `${C.indigo}2e`,
            border: `2px solid ${C.indigo}`,
            borderRadius: 8,
          })
        )
      )
    ),
    h('div', {
      height: 30,
      background: `${C.dim}26`,
      border: `2px solid ${C.dim}`,
      borderRadius: 8,
    }),
    h(
      'div',
      { display: 'flex', color: C.sub, fontSize: 22, fontWeight: 700 },
      'CPU — 少数の強力なコア'
    )
  );

// GPUダイ: 細い制御 + 大量の小さな演算ユニット
const gpuDie = () =>
  h(
    'div',
    {
      display: 'flex',
      flexDirection: 'column',
      background: C.panel,
      border: `2px solid ${C.panelBorder}`,
      borderRadius: 18,
      padding: 20,
      gap: 12,
      width: 420,
    },
    h('div', {
      height: 12,
      background: `${C.orange}33`,
      border: `2px solid ${C.orange}`,
      borderRadius: 6,
    }),
    ...[0, 1, 2].map(() =>
      h(
        'div',
        { display: 'flex', gap: 8 },
        ...Array.from({ length: 9 }, () =>
          h('div', {
            width: 34,
            height: 34,
            background: `${C.indigo}2e`,
            border: `2px solid ${C.indigo}`,
            borderRadius: 6,
          })
        )
      )
    ),
    h(
      'div',
      { display: 'flex', color: C.sub, fontSize: 22, fontWeight: 700 },
      'GPU — 大量の小さな演算ユニット'
    )
  );

const root = h(
  'div',
  {
    width: 1200,
    height: 630,
    display: 'flex',
    background: `linear-gradient(135deg, ${C.bg} 0%, #171a28 60%, #1b1430 100%)`,
    color: C.text,
    fontFamily: 'Noto Sans JP',
    padding: 56,
    gap: 48,
    alignItems: 'center',
  },
  // 左: タイトル
  h(
    'div',
    { display: 'flex', flexDirection: 'column', flex: 1, gap: 28 },
    h(
      'div',
      { display: 'flex', gap: 12 },
      h(
        'div',
        {
          display: 'flex',
          background: `${C.indigo}22`,
          border: `2px solid ${C.indigo}`,
          color: C.indigo,
          borderRadius: 999,
          padding: '6px 18px',
          fontSize: 24,
          fontWeight: 700,
        },
        '全28章'
      ),
      h(
        'div',
        {
          display: 'flex',
          background: `${C.orange}1f`,
          border: `2px solid ${C.orange}`,
          color: C.orange,
          borderRadius: 999,
          padding: '6px 18px',
          fontSize: 24,
          fontWeight: 700,
        },
        'ブラウザで実行できる実験つき'
      )
    ),
    h(
      'div',
      {
        display: 'flex',
        flexDirection: 'column',
        fontSize: 76,
        fontWeight: 700,
        lineHeight: 1.25,
      },
      h('div', { display: 'flex' }, 'Rustではじめる'),
      h(
        'div',
        { display: 'flex', color: C.indigo },
        'CPUとGPU'
      )
    ),
    h(
      'div',
      {
        display: 'flex',
        flexDirection: 'column',
        fontSize: 30,
        color: C.sub,
        lineHeight: 1.55,
      },
      h('div', { display: 'flex' }, '実測でたどる、'),
      h('div', { display: 'flex' }, '計算機の仕組みと最適化の教科書')
    ),
    h(
      'div',
      { display: 'flex', fontSize: 24, color: C.dim, marginTop: 12 },
      'rust-cpu-gpu-book.void.app'
    )
  ),
  // 右: CPU vs GPU ダイ
  h(
    'div',
    { display: 'flex', flexDirection: 'column', gap: 24 },
    cpuDie(),
    gpuDie()
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
