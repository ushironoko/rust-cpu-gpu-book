// ビルド出力の検証。特に mermaid は、mmdc(headless Chromium)が見つからない
// 場合に ox-content が「警告のみでフェンスをコードブロックのまま残す」
// サイレントフォールバックをするため、ソースのフェンス数と生成HTML内の
// SVG数を突き合わせて不一致ならビルドを失敗させる。
// v3 移行後は以下も検証する:
//   - :::note → .ox-container--note の変換数(containers オプション)
//   - play フェンス → <ox-code-play> のラップ数(@ox-content/code-play)
//   - wgsl/asm/llvm/toml の未ハイライトブロック残存(highlight-fallback)
//   - 前後ページリンクの出力(ssg.pagination)
// vite.config.ts の closeBundle から呼ばれるほか、単体でも実行できる:
//   node scripts/verify-build.mjs
import { globSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const SRC = '.ox-docs';
const FALLBACK_LANGS = ['wgsl', 'asm', 'llvm', 'toml'];

// '.ox-docs/cpu/01-x.md' → 'cpu/01-x/index.html' / '.ox-docs/index.md' → 'index.html'
function toHtmlPath(mdFile) {
  const stem = mdFile.slice(SRC.length + 1).replace(/\.md$/, '');
  return stem === 'index' ? 'index.html' : `${stem}/index.html`;
}

const countFences = (markdown, lang) =>
  (markdown.match(new RegExp(`^\`\`\`${lang}\\b.*$`, 'gm')) ?? []).length;

export function verifyBuild(outDir = 'dist') {
  const errors = [];
  const files = globSync(`${SRC}/**/*.md`);
  if (files.length === 0) {
    throw new Error(`[verify-build] ${SRC}/ が空。ビルド順序を確認してください`);
  }

  let pages = 0;
  let mermaidTotal = 0;
  let noteTotal = 0;
  let playTotal = 0;
  let pagerTotal = 0;
  for (const mdFile of files) {
    const htmlPath = join(outDir, toHtmlPath(mdFile));
    if (!existsSync(htmlPath)) {
      errors.push(`ページ未生成: ${htmlPath} (${mdFile})`);
      continue;
    }
    pages++;
    const md = readFileSync(mdFile, 'utf8');
    const html = readFileSync(htmlPath, 'utf8');

    // mermaid のサイレントフォールバック検出
    const mermaidExpected = countFences(md, 'mermaid');
    if (mermaidExpected > 0) {
      const rendered = (html.match(/<div class="ox-mermaid">/g) ?? []).length;
      mermaidTotal += mermaidExpected;
      if (rendered < mermaidExpected) {
        errors.push(
          `mermaid未レンダリング: ${htmlPath} (期待 ${mermaidExpected}, 実際 ${rendered})` +
            ' — mmdc/headless Chromium が見つからない可能性。' +
            ' PUPPETEER_EXECUTABLE_PATH の指定を確認してください'
        );
      }
      if (/data-language="mermaid"/.test(html)) {
        errors.push(`mermaidフェンスがコードブロックのまま: ${htmlPath}`);
      }
    }

    // :::note → containers の変換
    const noteExpected = (md.match(/^:::note/gm) ?? []).length;
    if (noteExpected > 0) {
      const rendered = (html.match(/class="ox-container ox-container--note"/g) ?? []).length;
      noteTotal += noteExpected;
      if (rendered !== noteExpected) {
        errors.push(`:::note 未変換: ${htmlPath} (期待 ${noteExpected}, 実際 ${rendered})`);
      }
    }

    // play フェンス → code-play ウィジェット
    const playExpected = countFences(md, 'rust play');
    if (playExpected > 0) {
      const wrapped = (html.match(/<ox-code-play /g) ?? []).length;
      playTotal += playExpected;
      if (wrapped !== playExpected) {
        errors.push(`play未ラップ: ${htmlPath} (期待 ${playExpected}, 実際 ${wrapped})`);
      }
    }

    // highlight-fallback の取りこぼし
    for (const lang of FALLBACK_LANGS) {
      if (html.includes(`<pre><code class="language-${lang}">`)) {
        errors.push(`${lang} が未ハイライト: ${htmlPath}`);
      }
    }

    if (html.includes('class="pager"')) pagerTotal++;
  }

  // 前後ページリンク: サイドバー掲載ページ数-端の分は出るはず。
  // 全滅していたら pagination 設定が効いていない
  if (pagerTotal === 0) {
    errors.push('前後ページリンクが1ページも出力されていない (ssg.pagination)');
  }

  if (!existsSync(join(outDir, 'search-index.json'))) {
    errors.push(`検索インデックス未生成: ${outDir}/search-index.json`);
  }
  if (!existsSync(join(outDir, 'ox-code-play.js'))) {
    errors.push(`code-play クライアント未生成: ${outDir}/ox-code-play.js`);
  }

  if (errors.length > 0) {
    throw new Error(`[verify-build] ${errors.length}件の問題:\n  - ${errors.join('\n  - ')}`);
  }
  return { pages, mermaid: mermaidTotal, notes: noteTotal, plays: playTotal, pagers: pagerTotal };
}

if (process.argv[1] && process.argv[1].endsWith('verify-build.mjs')) {
  const r = verifyBuild();
  console.log(
    `[verify-build] OK: ${r.pages} pages, ${r.mermaid} mermaid, ${r.notes} notes, ${r.plays} plays, ${r.pagers} pagers`
  );
}
