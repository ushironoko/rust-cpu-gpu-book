// 一度きりの変換スクリプト: docs/ 内の <figure class="book-figure"> ブロックに
// 残っている MDX 時代の JSX 式({Array.from(...)} や <style>{`...`}</style>)を
// 実際に評価し、静的な SVG マークアップへ展開して書き戻す。
// bun の JSX 変換(自動ランタイム)で評価し、生成された要素ツリーを
// 文字列化する。使い方: bun run scripts/render-figures.mjs
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { globSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

// bun が react 不在時に生成する要素オブジェクト({type, props})を
// SVG/HTML 文字列へ変換する
const RENDERER = `
const esc = (s) => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;');
export function render(node) {
  if (node === null || node === undefined || node === false || node === true) return '';
  if (Array.isArray(node)) return node.map(render).join('');
  if (typeof node !== 'object') return esc(node);
  const { type, props } = node;
  if (typeof type !== 'string') throw new Error('unsupported node: ' + JSON.stringify(node).slice(0, 120));
  const { children, ...attrs } = props ?? {};
  const attrText = Object.entries(attrs)
    .filter(([, v]) => v !== undefined && v !== null && v !== false)
    .map(([k, v]) => \` \${k}="\${String(v).replaceAll('"', '&quot;')}"\`)
    .join('');
  return \`<\${type}\${attrText}>\${render(children)}</\${type}>\`;
}
`;

const dir = mkdtempSync(join(tmpdir(), 'figures-'));
writeFileSync(join(dir, 'render.mjs'), RENDERER);

function renderFigure(source, file, index) {
  const jsxFile = join(dir, `fig-${index}.jsx`);
  writeFileSync(
    jsxFile,
    `import { render } from './render.mjs';\nconst out = (\n${source}\n);\nprocess.stdout.write(render(out));\n`
  );
  const r = spawnSync('bun', ['run', jsxFile], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`${file} figure #${index}: ${r.stderr}`);
  const html = r.stdout.trim();
  if (!html.startsWith('<figure')) {
    throw new Error(`${file} figure #${index}: unexpected output: ${html.slice(0, 120)}`);
  }
  return html;
}

let converted = 0;
for (const file of globSync('docs/**/*.md')) {
  const src = readFileSync(file, 'utf8');
  if (!src.includes('book-figure')) continue;
  let i = 0;
  const out = src.replace(
    /<figure class="book-figure">[\s\S]*?<\/figure>/g,
    (block) => {
      // JSX 式を含まない図はそのまま
      if (!/\{/.test(block)) return block;
      const rendered = renderFigure(block, file, i++);
      converted++;
      return rendered;
    }
  );
  if (out !== src) {
    writeFileSync(file, out);
    console.log(`rendered figures in ${file}`);
  }
}
rmSync(dir, { recursive: true, force: true });
console.log(`converted ${converted} figures`);
