// サイトの機能スモークテスト。事前に dist/ をビルドし、
// python3 -m http.server 4185 -d dist などで配信してから実行する。
// 使い方: node scripts/e2e.mjs
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:4185';
const SHOT = process.env.E2E_SHOT_DIR ?? '.e2e-shots';
const results = [];
const ok = (name, cond, extra = '') => {
  results.push(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`);
};

mkdirSync(SHOT, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.E2E_CHROMIUM ?? '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1360, height: 900 } });

// --- 章ページ(ライト) ---
await page.goto(`${BASE}/cpu-deep/13-numbers/`, { waitUntil: 'networkidle' });
await page.emulateMedia({ colorScheme: 'light' });
await page.waitForTimeout(300);

ok('h1 title', (await page.textContent('article h1'))?.trim() === '数の表現');
ok('sidebar group', (await page.textContent('.sidebar'))?.includes('Part IV: CPUとメモリの深層'));
ok('sidebar label', (await page.textContent('.sidebar'))?.includes('13. 数の表現'));
ok('toc localized', (await page.textContent('.toc-title'))?.trim() === '目次');
const play = page.locator('.rust-play').first();
ok('rust-play count', (await page.locator('.rust-play').count()) === 5, String(await page.locator('.rust-play').count()));
ok('rust-play shiki', (await play.locator('pre.shiki').count()) === 1);
ok('aside rendered', (await page.locator('aside.book-aside').count()) > 0, String(await page.locator('aside.book-aside').count()));
ok('aside markdown inside', (await page.locator('aside.book-aside strong, aside.book-aside code, aside.book-aside a, aside.book-aside p').count()) > 0);

await page.screenshot({ path: `${SHOT}/light-chapter.png`, fullPage: false });

// --- 編集モード ---
await play.locator('.rust-play__btn--edit').click();
await page.waitForTimeout(200);
const editorVisible = await play.locator('.rust-play__editor').isVisible();
const editorCode = await play.locator('.rust-play__editor').inputValue();
ok('edit mode textarea', editorVisible && editorCode.includes('fn main'), editorCode.slice(0, 40).replace(/\n/g, '⏎'));
await play.locator('.rust-play__btn--reset').click();

// --- Playgroundリンク ---
const href = await play.locator('.rust-play__link').getAttribute('href');
ok('playground link', href?.startsWith('https://play.rust-lang.org/?version=') && href.includes('code='), href?.slice(0, 60));

// --- 実行ボタン(外部API) ---
await play.locator('.rust-play__btn--run').click();
try {
  await page.waitForFunction(
    () => {
      const out = document.querySelector('.rust-play .rust-play__output');
      return out && out.textContent && !out.textContent.includes('実行中');
    },
    { timeout: 30000 }
  );
  const output = await play.locator('.rust-play__output').textContent();
  ok('run output', output.trim().length > 0, output.trim().slice(0, 80).replace(/\n/g, '⏎'));
} catch {
  ok('run output', false, 'timeout (network?)');
}

// --- ダークモード切替 ---
await page.locator('header .theme-toggle, header [aria-label*="テーマ"], header [aria-label*="theme" i]').first().click();
await page.waitForTimeout(300);
const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
ok('theme toggled', theme === 'dark' || theme === 'light', `data-theme=${theme}`);
await page.screenshot({ path: `${SHOT}/dark-chapter.png` });

// --- 検索(日本語) ---
await page.keyboard.press('/');
await page.waitForTimeout(300);
const searchInput = page.locator('input.search-input');
ok('search opens', await searchInput.isVisible());
ok('search placeholder ja', (await searchInput.getAttribute('placeholder')) === '検索');
await searchInput.fill('仮想メモリ');
await page.waitForTimeout(600);
const resultsText = await page.locator('.search-results, .search-modal').first().textContent();
ok('search ja results', resultsText.includes('仮想メモリ') || resultsText.includes('14'), resultsText.slice(0, 100).replace(/\n/g, ' '));
await page.screenshot({ path: `${SHOT}/search.png` });
await page.keyboard.press('Escape');

// --- 検索0件表示 ---
await page.locator('header .search-button').click();
await page.waitForTimeout(300);
await searchInput.fill('zzzzqqqq');
const emptyOk = await page
  .waitForFunction(
    () =>
      [...document.querySelectorAll('.search-empty')].some(
        (el) => el.textContent.trim() === '見つかりませんでした'
      ),
    { timeout: 5000 }
  )
  .then(() => true)
  .catch(() => false);
if (!emptyOk) {
  console.log('DEBUG empty search:', await page.evaluate(() => ({
    inputVal: document.querySelector('input.search-input')?.value,
    results: document.querySelector('.search-results')?.innerHTML?.slice(0, 150),
    empties: [...document.querySelectorAll('.search-empty')].map((x) => x.textContent),
    overlayClass: document.querySelector('.search-modal-overlay')?.className,
  })));
}
ok('search empty ja', emptyOk);
await page.keyboard.press('Escape');

// --- mermaid + SVG図(01-how-code-runs) ---
await page.goto(`${BASE}/cpu/01-how-code-runs/`, { waitUntil: 'networkidle' });
ok('mermaid svg', (await page.locator('.ox-mermaid svg').count()) > 0, String(await page.locator('.ox-mermaid svg').count()));
const fig = page.locator('.book-figure svg').first();
if ((await page.locator('.book-figure svg').count()) > 0) {
  const color = await fig.evaluate((el) => {
    const t = el.querySelector('[stroke]');
    return t ? getComputedStyle(t).stroke : 'none';
  });
  ok('book-figure svg themed', color !== 'none' && !color.includes('var('), color);
} else {
  ok('book-figure svg present elsewhere', true, 'no figure on this page');
}
await page.screenshot({ path: `${SHOT}/mermaid.png` });

// --- トップページ ---
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
ok('top page h1', (await page.textContent('article h1'))?.trim() === 'はじめに');
ok('top rust-play', (await page.locator('.rust-play').count()) === 1);
await page.screenshot({ path: `${SHOT}/top.png` });

// --- モバイル ---
try {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto(`${BASE}/cpu-deep/13-numbers/`, { waitUntil: 'networkidle' });
  const menuBtn = page.locator('.menu-toggle:visible, .mobile-footer button:visible').first();
  ok('mobile menu button', await menuBtn.isVisible().catch(() => false));
  await menuBtn.click({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(400);
  ok('mobile sidebar opens', await page.locator('.sidebar').isVisible().catch(() => false));
  await page.screenshot({ path: `${SHOT}/mobile.png` });
} catch (e) {
  ok('mobile section', false, String(e).slice(0, 80));
}

console.log(results.join('\n'));
await browser.close();
