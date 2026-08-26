// v3 で highlightLangs が削除され、tree-sitter 文法の無い言語は
// <pre><code class="language-*"> のまま出力される。ここでは SSG 後の
// dist HTML を走査し、該当ブロックだけを Shiki でハイライトして
// ox-content 本体と同一の CSS 変数契約(--octc-shiki-* + GitHub Dark
// フォールバック、crates/ox_content_highlight 由来)の markup に置き換える。
// toml/wgsl は 3.0.0-alpha.4 でネイティブ文法が追加されたため対象から
// 外した(#817)。asm/llvm も upstream に文法が追加されたら削除する。
import { globSync, readFileSync, writeFileSync } from 'node:fs';
import { createHighlighter, createCssVariablesTheme } from 'shiki';
import asm from 'shiki/langs/asm.mjs';
import llvm from 'shiki/langs/llvm.mjs';

const LANGS = [...asm, ...llvm];
const LANG_NAMES = ['asm', 'llvm'];

// ox-content native highlighter (theme.rs) と同一のトークン→フォールバック表。
// 変数プレフィックスは alpha.9 で --octc-shiki-* から --octc-syntax-* に、
// pre のクラスは shiki から ox-highlight に改名された
const VARIABLE_DEFAULTS = {
  foreground: '#e6edf3',
  background: '#0d1117',
  'token-comment': '#8b949e',
  'token-constant': '#79c0ff',
  'token-function': '#d2a8ff',
  'token-keyword': '#ff7b72',
  'token-parameter': '#ffa657',
  'token-punctuation': '#c9d1d9',
  'token-string': '#a5d6ff',
  'token-link': '#a5d6ff',
  'token-string-expression': '#a5d6ff',
};

const decodeEntities = (s) =>
  s
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&amp;', '&');

const PATTERN = new RegExp(
  `<pre><code class="language-(${LANG_NAMES.join('|')})">([\\s\\S]*?)</code></pre>`,
  'g'
);

export async function highlightFallback(outDir = 'dist') {
  const highlighter = await createHighlighter({
    themes: [
      createCssVariablesTheme({
        name: 'css-variables',
        variablePrefix: '--octc-syntax-',
        variableDefaults: VARIABLE_DEFAULTS,
        fontStyle: true,
      }),
    ],
    langs: LANGS,
  });
  let blocks = 0;
  const langs = new Set();
  try {
    for (const path of globSync(`${outDir}/**/*.html`)) {
      const html = readFileSync(path, 'utf8');
      const next = html.replace(PATTERN, (_whole, lang, body) => {
        blocks++;
        langs.add(lang);
        const code = decodeEntities(body).replace(/\n$/, '');
        return highlighter
          .codeToHtml(code, { lang, theme: 'css-variables' })
          .replace('class="shiki css-variables"', 'class="ox-highlight css-variables"')
          .replace(/\n$/, '');
      });
      if (next !== html) writeFileSync(path, next);
    }
  } finally {
    highlighter.dispose();
  }
  return { blocks, langs: [...langs] };
}

if (process.argv[1] && process.argv[1].endsWith('highlight-fallback.mjs')) {
  const r = await highlightFallback();
  console.log(
    `[highlight-fallback] ${r.blocks} blocks highlighted (${r.langs.join(', ') || 'none'})`
  );
}
