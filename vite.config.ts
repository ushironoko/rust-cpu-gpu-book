import { readFileSync, watch } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import { oxContent } from '@ox-content/vite-plugin';
import { codePlay } from '@ox-content/code-play';
import holo from '@ox-content/theme-holo';
import github from '@ox-content/theme-color-github';
import { preprocessDocs } from './scripts/preprocess-docs.mjs';
import { normalizeEntities, patchCodePlay } from './scripts/patch-code-play.mjs';
import { highlightFallback } from './scripts/highlight-fallback.mjs';
import { verifyBuild } from './scripts/verify-build.mjs';
import { buildSidebar } from './config/sidebar.mjs';

// docs/ を ox-content が読む .ox-docs/ へ展開する(RustPlay → play フェンス)。
// SSG・検索・devサーバは全て srcDir をディスクから直接読むため、
// Vite の transform ではなくビルド前のファイル生成で行う。
// :::note は v3 の containers オプションが処理するので展開しない。
function preprocessPlugin(): Plugin {
  return {
    name: 'book:preprocess-docs',
    buildStart() {
      const r = preprocessDocs();
      console.log(
        `[preprocess-docs] ${r.files} files, ${r.plays} RustPlay, ${r.asides} asides`
      );
    },
    configureServer() {
      let timer: ReturnType<typeof setTimeout> | undefined;
      watch('docs', { recursive: true }, (_event, file) => {
        if (!file?.endsWith('.md')) return;
        clearTimeout(timer);
        timer = setTimeout(() => {
          try {
            preprocessDocs();
          } catch (err) {
            console.error('[preprocess-docs]', err);
          }
        }, 100);
      });
    },
  };
}

// SSG は本文中の < と & の一部を16進エンティティ(&#x3C; / &#x26;)で出力するが、
// code-play の SSG マッチング(decodeHtml)は名前付きエンティティしか解さず、
// 該当コードを含む play フェンスがラップされない(3.0.0-alpha.1 の既知の癖)。
// codePlay の closeBundle より前に等価な名前付きエンティティへ正規化して回避する。
function normalizeEntitiesPlugin(): Plugin {
  return {
    name: 'book:normalize-entities',
    apply: 'build',
    closeBundle() {
      const n = normalizeEntities('dist');
      console.log(`[normalize-entities] ${n} pages normalized`);
    },
  };
}

// SSG と code-play の closeBundle(登録順に走る)より後ろで dist を後処理する。
// 1. patchCodePlay: RustPlay 属性由来の widget 別 config(release/nightly)を
//    payload に反映(code-play はグローバル config しか持たないため)
// 2. highlightFallback: tree-sitter 非対応言語(wgsl/asm/llvm/toml)を Shiki で
//    ハイライト(v3 で highlightLangs が削除されたための暫定措置)
// 3. verifyBuild: mermaid サイレントフォールバック等の検出
function postBuildPlugin(): Plugin {
  return {
    name: 'book:post-build',
    apply: 'build',
    async closeBundle() {
      const p = patchCodePlay('dist');
      console.log(`[patch-code-play] ${p.widgets} widgets, ${p.patched} patched`);
      const h = await highlightFallback('dist');
      console.log(
        `[highlight-fallback] ${h.blocks} blocks highlighted (${h.langs.join(', ') || 'none'})`
      );
      const v = verifyBuild('dist');
      console.log(
        `[verify-build] OK: ${v.pages} pages, ${v.mermaid} mermaid, ${v.notes} notes, ${v.plays} plays, ${v.pagers} pagers`
      );
    },
  };
}

export default defineConfig({
  plugins: [
    preprocessPlugin(),
    oxContent({
      srcDir: '.ox-docs',
      highlight: true,
      mermaid: true,
      cjkEmphasis: true,
      containers: {
        types: {
          // ビルトイン note の既定ラベルを日本語化(:::note[題]は個別優先)
          note: { title: 'ノート' },
        },
      },
      docs: { enabled: false },
      search: {
        placeholder: '検索',
      },
      i18n: {
        enabled: true,
        defaultLocale: 'ja',
        locales: [{ code: 'ja', name: '日本語' }],
      },
      ssg: {
        siteName: 'RustではじめるCPUとGPU',
        siteUrl: 'https://rust-cpu-gpu-book.void.app',
        ogImage: 'https://rust-cpu-gpu-book.void.app/ogp.png',
        lang: 'ja',
        // v2.90 まで自作していた前後ページリンク(inject-pager.mjs)の置き換え。
        // 順序は theme.sidebar (config/sidebar.mjs) が単一情報源
        pagination: true,
        theme: [
          holo,
          github,
          {
            // v3 で右カラム目次(On this page)が opt-in になった
            aside: true,
            sidebar: buildSidebar(),
            css: readFileSync('src/theme/custom.css', 'utf8'),
            js:
              readFileSync('src/theme/ja-ui.js', 'utf8') +
              '\n' +
              readFileSync('src/theme/play-output.js', 'utf8'),
          },
        ],
      },
    }),
    normalizeEntitiesPlugin(),
    codePlay({
      // Rust: Run + Typecheck。実行は play.rust-lang.org へブラウザから
      // 直接 POST(旧 rust-play.js と同方式)。widget 別の channel/mode は
      // postBuildPlugin の patchCodePlay が payload に反映する
      languages: { rust: true },
      srcDir: '.ox-docs',
    }),
    postBuildPlugin(),
  ],
});
