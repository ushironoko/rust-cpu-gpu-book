// docs/ の Markdown を ox-content が処理できる形へ展開して .ox-docs/ に出力する。
//
// ox-content には aside 記法(:::note)がなく、SSG はフレームワーク
// コンポーネントも Vite の transform も通さないため、ビルド前に
// テキストレベルで次の2つを展開する:
//
//   1. :::note[タイトル] 〜 :::  → <aside> + Markdown本文 (空行区切りで
//      HTMLブロックとMarkdownを交互に置く CommonMark のパターン)
//   2. <RustPlay snippet="..." /> → 静的HTML + rust フェンスコード
//      (ハイライトは ox-content 本体のパイプラインに任せる)
//
// 実行ボタン等の動作は src/theme/rust-play.js (全ページ共通・イベント
// 委譲) が担う。Starlight 版 RustPlay.astro と同じ構成。
import { globSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';

const SRC = 'docs';
const OUT = '.ox-docs';

const escapeHtml = (s) =>
  s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

function expandAsides(src, file) {
  const lines = src.split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^:::note(?:\[(.+?)\])?\s*$/);
    if (!m) {
      if (/^:::/.test(lines[i])) {
        throw new Error(`${file}:${i + 1}: unsupported directive: ${lines[i]}`);
      }
      out.push(lines[i]);
      continue;
    }
    const title = m[1] ?? 'ノート';
    const body = [];
    let j = i + 1;
    for (; j < lines.length && lines[j].trim() !== ':::'; j++) body.push(lines[j]);
    if (j === lines.length) throw new Error(`${file}:${i + 1}: unclosed :::note`);
    out.push(
      `<aside aria-label="${escapeHtml(title)}" class="book-aside">`,
      `<p class="book-aside__title" aria-hidden="true">${escapeHtml(title)}</p>`,
      `<div class="book-aside__content">`,
      '',
      ...body,
      '',
      `</div>`,
      `</aside>`
    );
    i = j;
  }
  return out.join('\n');
}

function expandRustPlay(src, file) {
  return src.replace(/^<RustPlay\s+([^>]*?)\/>\s*$/gm, (whole, attrText) => {
    const attrs = {};
    for (const am of attrText.matchAll(/(\w+)="([^"]*)"/g)) attrs[am[1]] = am[2];
    const { snippet, title, channel = 'stable', mode = 'debug', edition = '2024' } = attrs;
    if (!snippet) throw new Error(`${file}: RustPlay without snippet: ${whole}`);
    const path = join('src/snippets', `${snippet}.rs`);
    const code = readFileSync(path, 'utf8').replace(/\n+$/, '\n');
    const playgroundUrl = `https://play.rust-lang.org/?version=${channel}&mode=${mode}&edition=${edition}&code=${encodeURIComponent(code)}`;
    const fence = '`````';
    return [
      `<div class="rust-play" data-channel="${channel}" data-mode="${mode}" data-edition="${edition}">`,
      `<div class="rust-play__code">`,
      title ? `<div class="rust-play__title">${escapeHtml(title)}</div>` : null,
      '',
      `${fence}rust`,
      code.replace(/\n$/, ''),
      fence,
      '',
      `</div>`,
      // ボタン類は rust-play.js が有効化する。JS無効時は
      // Playgroundリンクだけが機能する(元実装と同じ扱い)。
      `<div class="rust-play__toolbar">`,
      `<button class="rust-play__btn rust-play__btn--run" type="button">▶ 実行</button>`,
      `<button class="rust-play__btn rust-play__btn--edit" type="button">編集</button>`,
      `<button class="rust-play__btn rust-play__btn--reset" type="button" hidden>リセット</button>`,
      `<span class="spacer"></span>`,
      `<span class="rust-play__meta">${channel} / ${mode}</span>`,
      `<a class="rust-play__link" href="${playgroundUrl}" target="_blank" rel="noopener noreferrer">Playgroundで開く ↗</a>`,
      `</div>`,
      `<pre class="rust-play__output" aria-live="polite" hidden></pre>`,
      `</div>`,
    ]
      .filter((l) => l !== null)
      .join('\n');
  });
}

// Starlight は frontmatter の title をページ見出し(h1)として描画するが、
// ox-content のテーマは本文をそのまま出すだけなので、本文に h1 が
// なければ先頭に挿入して同じ見た目にする。
function injectTitleHeading(src, file) {
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
  let plays = 0;
  let asides = 0;
  for (const file of files) {
    let text = readFileSync(file, 'utf8');
    asides += (text.match(/^:::note/gm) ?? []).length;
    plays += (text.match(/^<RustPlay/gm) ?? []).length;
    text = injectTitleHeading(text, file);
    text = expandAsides(text, file);
    text = expandRustPlay(text, file);
    const dest = join(OUT, file.slice(SRC.length + 1));
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, text);
  }
  return { files: files.length, plays, asides };
}

if (process.argv[1] && process.argv[1].endsWith('preprocess-docs.mjs')) {
  const r = preprocessDocs();
  console.log(`[preprocess-docs] ${r.files} files, ${r.plays} RustPlay, ${r.asides} asides`);
}
