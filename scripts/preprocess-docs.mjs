// docs/ の Markdown を ox-content が処理できる形へ展開して .ox-docs/ に出力する。
//
// v3 移行後の役割:
//
//   1. <RustPlay snippet="..." /> → ```rust play フェンス
//      (ハイライトは ox-content、実行UIは @ox-content/code-play が担う)
//   2. frontmatter title の h1 注入 (v3 テーマも本文に h1 を出さないため)
//
// :::note は v3 の containers オプションがそのまま処理するので展開しない
// (タイポ検出のため :::note 以外のディレクティブは引き続きエラーにする)。
//
// code-play の config はグローバル設定しか無いため、RustPlay 属性由来の
// widget 別 config (mode="release" / channel="nightly" 等) はページごとの
// フェンス順 manifest に書き出し、ビルド後に scripts/patch-code-play.mjs が
// dist の payload へ反映する。
import { globSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';

const SRC = 'docs';
const OUT = '.ox-docs';
export const MANIFEST = join(OUT, 'code-play-manifest.json');

const escapeHtml = (s) =>
  s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

// :::note 以外の ::: ディレクティブ(タイポ等)を検出する。
// :::note 自体は containers オプションが処理するため素通しする。
function validateDirectives(src, file) {
  const lines = src.split('\n');
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    if (/^(```|~~~)/.test(lines[i])) inFence = !inFence;
    if (inFence) continue;
    if (/^:::/.test(lines[i]) && !/^:::note(\[|\s*$)/.test(lines[i]) && lines[i].trim() !== ':::') {
      throw new Error(`${file}:${i + 1}: unsupported directive: ${lines[i]}`);
    }
  }
}

function expandRustPlay(src, file, fences) {
  return src.replace(/^<RustPlay\s+([^>]*?)\/>[ \t]*$/gm, (whole, attrText) => {
    const attrs = {};
    for (const am of attrText.matchAll(/(\w+)="([^"]*)"/g)) attrs[am[1]] = am[2];
    const { snippet, title, channel = 'stable', mode = 'debug', edition = '2024' } = attrs;
    if (!snippet) throw new Error(`${file}: RustPlay without snippet: ${whole}`);
    const path = join('src/snippets', `${snippet}.rs`);
    const code = readFileSync(path, 'utf8').replace(/\n+$/, '');
    // code-play カタログの既定値(stable/debug/2024)と異なる分だけを記録
    const config = {};
    if (channel !== 'stable') config.channel = channel;
    if (mode !== 'debug') config.mode = mode;
    if (edition !== '2024') config.edition = edition;
    fences.push({ snippet, code, config });
    return [
      '',
      ...(title ? [`<div class="play-title">${escapeHtml(title)}</div>`, ''] : []),
      '```rust play',
      code,
      '```',
      '',
    ].join('\n');
  });
}

// Starlight は frontmatter の title をページ見出し(h1)として描画するが、
// ox-content のテーマは本文をそのまま出すだけなので、本文に h1 が
// なければ先頭に挿入して同じ見た目にする。
function injectTitleHeading(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return src;
  const title = m[1].match(/^title:\s*(.+)$/m)?.[1]?.trim().replace(/^['"]|['"]$/g, '');
  if (!title) return src;
  const body = src.slice(m[0].length);
  if (/^#\s/m.test(body.split('\n', 3)[0] ?? '') || body.trimStart().startsWith('# ')) return src;
  return `${m[0]}\n# ${title}\n${body}`;
}

export function preprocessDocs() {
  rmSync(OUT, { recursive: true, force: true });
  const files = globSync(`${SRC}/**/*.md`);
  const manifest = {};
  let plays = 0;
  let asides = 0;
  for (const file of files) {
    let text = readFileSync(file, 'utf8');
    asides += (text.match(/^:::note/gm) ?? []).length;
    validateDirectives(text, file);
    text = injectTitleHeading(text);
    const fences = [];
    text = expandRustPlay(text, file, fences);
    plays += fences.length;
    if (fences.length > 0) manifest[file.slice(SRC.length + 1).replace(/\.md$/, '')] = fences;
    const dest = join(OUT, file.slice(SRC.length + 1));
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, text);
  }
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
  return { files: files.length, plays, asides };
}

if (process.argv[1] && process.argv[1].endsWith('preprocess-docs.mjs')) {
  const r = preprocessDocs();
  console.log(`[preprocess-docs] ${r.files} files, ${r.plays} RustPlay, ${r.asides} asides`);
}
