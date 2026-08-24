import { readFileSync, watch } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import { oxContent } from '@ox-content/vite-plugin';
import holo from '@ox-content/theme-holo';
import github from '@ox-content/theme-color-github';
import wgsl from 'shiki/langs/wgsl.mjs';
import asm from 'shiki/langs/asm.mjs';
import llvm from 'shiki/langs/llvm.mjs';
import toml from 'shiki/langs/toml.mjs';
import { preprocessDocs } from './scripts/preprocess-docs.mjs';
import { injectPager } from './scripts/inject-pager.mjs';
import { verifyBuild } from './scripts/verify-build.mjs';
import { buildSidebar } from './config/sidebar.mjs';

// docs/ を ox-content が読む .ox-docs/ へ展開する(:::note と RustPlay)。
// SSG・検索・devサーバは全て srcDir をディスクから直接読むため、
// Vite の transform ではなくビルド前のファイル生成で行う。
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

// SSG完了後(closeBundleはプラグイン登録順に走る)に、生成HTMLへ
// 前後ページリンクを注入する。ox-contentのプラグイン群より後ろに置くこと。
function pagerPlugin(): Plugin {
  return {
    name: 'book:inject-pager',
    apply: 'build',
    closeBundle() {
      const n = injectPager('dist');
      console.log(`[inject-pager] injected into ${n} pages`);
      // mermaid のサイレントフォールバック(mmdc欠如時に図がコードブロックの
      // まま残る)を検出したらビルドを失敗させる
      const v = verifyBuild('dist');
      console.log(
        `[verify-build] OK: ${v.pages} pages, ${v.mermaid} mermaid diagrams rendered`
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
      highlightLangs: [...wgsl, ...asm, ...llvm, ...toml],
      mermaid: true,
      cjkEmphasis: true,
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
        theme: [
          holo,
          github,
          {
            sidebar: buildSidebar(),
            css: readFileSync('src/theme/custom.css', 'utf8'),
            js:
              readFileSync('src/theme/rust-play.js', 'utf8') +
              '\n' +
              readFileSync('src/theme/ja-ui.js', 'utf8'),
          },
        ],
      },
    }),
    pagerPlugin(),
  ],
});
