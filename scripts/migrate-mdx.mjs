// Starlight MDX → ox-content Markdown への一括変換。
// - import 行を削除(ox-content の .md/.mdx は JS を評価しないため)
// - <RustPlay code={var} .../> を <RustPlay snippet="chXX/name" .../> に書き換え
//   (snippet 名は削除した import のパスから解決する)
import { readFileSync, writeFileSync } from 'node:fs';
import { globSync } from 'node:fs';

const files = globSync('docs/**/*.md');
let totalRewrites = 0;

for (const file of files) {
  const src = readFileSync(file, 'utf8');
  const varToSnippet = new Map();
  let changed = false;

  let out = src.replace(
    /^import\s+(\w+)\s+from\s+'@snippets\/(.+?)\.rs\?raw';?\n/gm,
    (_, name, path) => {
      varToSnippet.set(name, path);
      changed = true;
      return '';
    }
  );
  out = out.replace(/^import\s+RustPlay\s+from\s+'@components\/RustPlay\.astro';?\n/gm, () => {
    changed = true;
    return '';
  });

  out = out.replace(/<RustPlay\s+code=\{(\w+)\}/g, (m, name) => {
    const snippet = varToSnippet.get(name);
    if (!snippet) {
      console.error(`${file}: unknown snippet variable ${name}`);
      process.exitCode = 1;
      return m;
    }
    totalRewrites++;
    return `<RustPlay snippet="${snippet}"`;
  });

  // frontmatter 直後の余分な空行の連続を1つに
  out = out.replace(/^(---\n[\s\S]*?\n---\n)\n+/m, '$1\n');

  if (changed || out !== src) {
    writeFileSync(file, out);
    console.log(`rewrote ${file}`);
  }
}
console.log(`RustPlay rewrites: ${totalRewrites}`);
