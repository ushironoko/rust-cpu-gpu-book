// ビルド出力の検証。特に mermaid は、mmdc(headless Chromium)が見つからない
// 場合に ox-content が「警告のみでフェンスをコードブロックのまま残す」
// サイレントフォールバックをするため、ソースのフェンス数と生成HTML内の
// SVG数を突き合わせて不一致ならビルドを失敗させる。
// vite.config.ts の closeBundle から呼ばれるほか、単体でも実行できる:
//   node scripts/verify-build.mjs
import { globSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const SRC = '.ox-docs';

// '.ox-docs/cpu/01-x.md' → 'cpu/01-x/index.html' / '.ox-docs/index.md' → 'index.html'
function toHtmlPath(mdFile) {
  const stem = mdFile.slice(SRC.length + 1).replace(/\.md$/, '');
  return stem === 'index' ? 'index.html' : `${stem}/index.html`;
}

function countMermaidFences(markdown) {
  return (markdown.match(/^```mermaid\s*$/gm) ?? []).length;
}

export function verifyBuild(outDir = 'dist') {
  const errors = [];
  const files = globSync(`${SRC}/**/*.md`);
  if (files.length === 0) {
    throw new Error(`[verify-build] ${SRC}/ が空。ビルド順序を確認してください`);
  }

  let pages = 0;
  let mermaidTotal = 0;
  for (const mdFile of files) {
    const htmlPath = join(outDir, toHtmlPath(mdFile));
    if (!existsSync(htmlPath)) {
      errors.push(`ページ未生成: ${htmlPath} (${mdFile})`);
      continue;
    }
    pages++;
    const expected = countMermaidFences(readFileSync(mdFile, 'utf8'));
    if (expected === 0) continue;
    const html = readFileSync(htmlPath, 'utf8');
    const rendered = (html.match(/<div class="ox-mermaid">/g) ?? []).length;
    mermaidTotal += expected;
    if (rendered < expected) {
      errors.push(
        `mermaid未レンダリング: ${htmlPath} (期待 ${expected}, 実際 ${rendered})` +
          ' — mmdc/headless Chromium が見つからない可能性。' +
          ' PUPPETEER_EXECUTABLE_PATH の指定を確認してください'
      );
    }
    // フォールバック時はフェンスがコードブロックとして残る
    if (/data-language="mermaid"/.test(html)) {
      errors.push(`mermaidフェンスがコードブロックのまま: ${htmlPath}`);
    }
  }

  if (!existsSync(join(outDir, 'search-index.json'))) {
    errors.push(`検索インデックス未生成: ${outDir}/search-index.json`);
  }

  if (errors.length > 0) {
    throw new Error(`[verify-build] ${errors.length}件の問題:\n  - ${errors.join('\n  - ')}`);
  }
  return { pages, mermaid: mermaidTotal };
}

if (process.argv[1] && process.argv[1].endsWith('verify-build.mjs')) {
  const r = verifyBuild();
  console.log(`[verify-build] OK: ${r.pages} pages, ${r.mermaid} mermaid diagrams rendered`);
}
