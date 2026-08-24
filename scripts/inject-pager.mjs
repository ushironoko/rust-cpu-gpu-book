// SSG が生成した dist/ の各ページに前後ページリンク(pager)を注入する。
// ox-content のデフォルトテーマには prev/next が存在しないため、
// サイドバー定義(config/sidebar.mjs)の順序を単一情報源として、
// ビルド後の静的HTMLへ Starlight と同様の静的な pager を挿入する。
// vite.config.ts のプラグインが closeBundle (ox-content の SSG 完了後) に呼ぶ。
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { buildSidebar } from '../config/sidebar.mjs';

const escapeHtml = (s) =>
  s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

// '/index.md' → { url: '/', file: 'index.html' }
// '/cpu/01-x.md' → { url: '/cpu/01-x/', file: 'cpu/01-x/index.html' }
function toPage(item) {
  const stem = item.link.replace(/\.md$/, '');
  if (stem === '/index') return { text: item.text, url: '/', file: 'index.html' };
  return { text: item.text, url: `${stem}/`, file: `${stem.slice(1)}/index.html` };
}

function pagerHtml(prev, next) {
  const card = (page, dir) => {
    if (!page) return '<span class="book-pager__spacer"></span>';
    const isPrev = dir === 'prev';
    return [
      `<a href="${page.url}" rel="${dir}" class="book-pager__link book-pager__link--${dir}">`,
      `<span class="book-pager__dir">${isPrev ? '前のページ' : '次のページ'}</span>`,
      `<span class="book-pager__title">${isPrev ? '← ' : ''}${escapeHtml(page.text)}${isPrev ? '' : ' →'}</span>`,
      `</a>`,
    ].join('');
  };
  return `\n<nav class="book-pager" aria-label="前後のページ">${card(prev, 'prev')}${card(next, 'next')}</nav>\n`;
}

export function injectPager(outDir = 'dist') {
  const pages = buildSidebar()
    .flatMap((group) => group.items)
    .map(toPage);
  let injected = 0;
  for (let i = 0; i < pages.length; i++) {
    const path = join(outDir, pages[i].file);
    if (!existsSync(path)) {
      console.warn(`[inject-pager] missing page: ${path}`);
      continue;
    }
    const html = readFileSync(path, 'utf8');
    if (html.includes('book-pager')) continue;
    const pager = pagerHtml(pages[i - 1], pages[i + 1]);
    const marker = '</article>';
    const at = html.lastIndexOf(marker);
    if (at === -1) {
      console.warn(`[inject-pager] no </article> in ${path}`);
      continue;
    }
    writeFileSync(path, html.slice(0, at) + pager + html.slice(at));
    injected++;
  }
  return injected;
}

if (process.argv[1] && process.argv[1].endsWith('inject-pager.mjs')) {
  console.log(`[inject-pager] injected into ${injectPager()} pages`);
}
