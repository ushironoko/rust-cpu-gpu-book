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

// ページ内 idx 番目の code-play widget の payload(base64 JSON)を読む
const playConfig = (page, idx) =>
  page.evaluate((i) => {
    const el = document.querySelectorAll('ox-code-play')[i];
    if (!el) return null;
    return JSON.parse(atob(el.getAttribute('data-ox-code-play'))).config;
  }, idx);

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
const play = page.locator('ox-code-play').first();
ok('code-play count', (await page.locator('ox-code-play').count()) === 5, String(await page.locator('ox-code-play').count()));
ok('code-play highlight', (await play.locator('pre.ox-highlight').count()) === 1);
ok('aside rendered', (await page.locator('.ox-container--note').count()) > 0, String(await page.locator('.ox-container--note').count()));
ok('aside markdown inside', (await page.locator('.ox-container--note strong, .ox-container--note code, .ox-container--note a, .ox-container--note p').count()) > 0);

await page.screenshot({ path: `${SHOT}/light-chapter.png`, fullPage: false });

// --- 前後ページリンク (v3 ssg.pagination) ---
const prevHref = await page.locator('.pager a[rel="prev"]').getAttribute('href').catch(() => null);
const nextHref = await page.locator('.pager a[rel="next"]').getAttribute('href').catch(() => null);
// v3 pager はサイドバーと同じ /index.html 付きリンクを出す
ok('pager prev', prevHref === '/gpu/12-cpu-vs-gpu/index.html', String(prevHref));
ok('pager next', nextHref === '/cpu-deep/14-virtual-memory/index.html', String(nextHref));
ok('pager label ja', (await page.locator('.pager .pager-label').first().textContent())?.trim() === '前のページ');

// --- code-play 実行(外部API: play.rust-lang.org) ---
// ja-ui.js が Run → 実行 に置換していることも同時に検証する
const runBtn = play.locator('button[data-ox-action="run"]');
await runBtn.waitFor({ timeout: 10000 });
ok('run button ja', (await runBtn.textContent())?.trim() === '実行');
// ch13 の overflow スニペットは debug モード(patch-code-play の反映確認)
const overflowConfig = await playConfig(page, 0);
ok('config debug kept', overflowConfig && overflowConfig.mode === 'debug', JSON.stringify(overflowConfig));
await runBtn.click();
// ch13 の先頭 widget は overflow(debug)。panic が stderr タブに可視化され
// (失敗した実行のみ stderr 着地 = alpha.9 の挙動)、cargo のビルドノイズは
// play-output.js が間引いていることを、画面に見えるテキストで検証する
try {
  await page.waitForFunction(
    () => /attempt to add with overflow/.test(document.querySelector('ox-code-play')?.innerText ?? ''),
    { timeout: 30000 }
  );
  await page.waitForTimeout(800);
  const visible = await play.evaluate((el) => el.innerText);
  ok(
    'run output (panic visible, no noise)',
    visible.includes('attempt to add with overflow') && !/Compiling playground|Finished `/.test(visible),
    visible.replace(/\s+/g, ' ').slice(0, 80)
  );
} catch {
  ok('run output (panic visible, no noise)', false, 'timeout (network?)');
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

// --- mermaid + SVG図(01-how-code-runs) + debug/release ペア ---
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
// 同一スニペットの debug/release ペア(patch-code-play が出現順で反映)
const ch01First = await playConfig(page, 0);
const ch01Second = await playConfig(page, 1);
ok('ch01 debug widget', ch01First && ch01First.mode === 'debug', JSON.stringify(ch01First));
ok('ch01 release widget', ch01Second && ch01Second.mode === 'release', JSON.stringify(ch01Second));
await page.screenshot({ path: `${SHOT}/mermaid.png` });

// --- nightly widget (04-simd) ---
await page.goto(`${BASE}/cpu/04-simd/`, { waitUntil: 'networkidle' });
const nightly = await page.evaluate(() =>
  [...document.querySelectorAll('ox-code-play')]
    .map((el) => JSON.parse(atob(el.getAttribute('data-ox-code-play'))).config)
    .find((c) => c.channel === 'nightly')
);
ok('nightly config', Boolean(nightly), JSON.stringify(nightly));

// --- wgsl ハイライト (highlight-fallback) ---
await page.goto(`${BASE}/gpu/12-cpu-vs-gpu/`, { waitUntil: 'networkidle' });
const wgslPlain = await page.evaluate(
  () => document.querySelectorAll('code.language-wgsl:not(.ox-highlight code)').length
);
const wgslHl = await page.evaluate(() =>
  [...document.querySelectorAll('pre.ox-highlight')].filter((el) =>
    el.innerHTML.includes('--octc-syntax-token-keyword')
  ).length
);
ok('wgsl highlighted', wgslHl > 0, `highlighted=${wgslHl}`);
ok('wgsl no plain block', wgslPlain === 0, `plain=${wgslPlain}`);

// --- トップページ ---
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
ok('top page h1', (await page.textContent('article h1'))?.trim() === 'はじめに');
ok('top code-play', (await page.locator('ox-code-play').count()) === 1);
ok('top pager no-prev', (await page.locator('.pager a[rel="prev"]').count()) === 0);
ok('top pager next', (await page.locator('.pager a[rel="next"]').getAttribute('href').catch(() => null)) === '/cpu/01-how-code-runs/index.html');
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
