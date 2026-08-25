// code-play の widget config はグローバル設定しか無いため、preprocess が
// 書き出したページ別・フェンス順の manifest (.ox-docs/code-play-manifest.json)
// をもとに、SSG 後の dist HTML 内 <ox-code-play data-ox-code-play="..."> の
// base64 payload へ widget 別 config (mode/channel/edition) を反映する。
//
// widget はページ内の出現順で manifest と突き合わせる(同一スニペットを
// debug/release で使い分けるページがあるため、コード内容だけでは特定できない)。
// 順序やコードが食い違ったら移行機構のドリフトなのでビルドを失敗させる。
import { globSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { MANIFEST } from './preprocess-docs.mjs';

const normalize = (s) => s.replace(/\r\n/g, '\n').replace(/\s+$/, '');

// SSG は本文の < / & の一部を16進エンティティで出力するが、code-play の
// SSG マッチングは &lt; / &amp; しか解さない(3.0.0-alpha.1)。等価な
// 名前付きエンティティへ正規化する。codePlay の closeBundle より前に呼ぶこと。
export function normalizeEntities(outDir = 'dist') {
  let pages = 0;
  for (const path of globSync(`${outDir}/**/*.html`)) {
    const html = readFileSync(path, 'utf8');
    const next = html.replaceAll('&#x3C;', '&lt;').replaceAll('&#x26;', '&amp;');
    if (next !== html) {
      writeFileSync(path, next);
      pages++;
    }
  }
  return pages;
}

export function patchCodePlay(outDir = 'dist') {
  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  let widgets = 0;
  let patched = 0;
  for (const [page, fences] of Object.entries(manifest)) {
    const path =
      page === 'index' ? join(outDir, 'index.html') : join(outDir, page, 'index.html');
    if (!existsSync(path)) {
      throw new Error(`[patch-code-play] missing page: ${path}`);
    }
    let i = 0;
    const html = readFileSync(path, 'utf8').replace(
      /data-ox-code-play="([^"]+)"/g,
      (whole, b64) => {
        const fence = fences[i++];
        widgets++;
        if (!fence) {
          throw new Error(`[patch-code-play] ${page}: more widgets than manifest fences`);
        }
        const payload = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
        if (normalize(payload.code) !== normalize(fence.code)) {
          throw new Error(
            `[patch-code-play] ${page}: widget #${i} code mismatch (expected ${fence.snippet})`
          );
        }
        if (Object.keys(fence.config).length === 0) return whole;
        payload.config = { ...payload.config, ...fence.config };
        patched++;
        const encoded = Buffer.from(JSON.stringify(payload)).toString('base64');
        return `data-ox-code-play="${encoded}"`;
      }
    );
    if (i !== fences.length) {
      throw new Error(
        `[patch-code-play] ${page}: ${fences.length} play fences but only ${i} widgets in HTML`
      );
    }
    writeFileSync(path, html);
  }
  return { widgets, patched };
}

if (process.argv[1] && process.argv[1].endsWith('patch-code-play.mjs')) {
  const r = patchCodePlay();
  console.log(`[patch-code-play] ${r.widgets} widgets, ${r.patched} patched`);
}
