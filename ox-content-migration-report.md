# Starlight → ox-content 移行可否調査レポート

調査日: 2026-08-24
対象: 本リポジトリ (Astro 7 + Starlight 0.41) → [ox-content](https://ox-content.void.app/) (@ox-content/vite-plugin)
条件: **現在使っている全機能を完全に再現できること**

## 結論

**条件付きで移行可能。** 本書が使っている機能の大半（検索・Mermaid・ハイライト・テーマ・OGP・サイドバー・ビルド/デプロイ）は ox-content のビルトイン機能＋設定で置き換えられる。ただし「完全再現」を厳密に満たすには、ビルトインでは埋まらないギャップが **3つ** あり、いずれも公式の拡張点（transformer / アイランドコンポーネント / カスタムJSXテーマ）での自作が必要になる。

1. **`:::note` aside 記法**（15箇所）— ox-content に aside/admonition 記法が存在しない
2. **RustPlay コンポーネント**（45箇所）— 移植可能だが、.astro → React/Vue/Svelte/Solid への書き換え＋全使用箇所の書き換えが必須
3. **前後ページリンク（prev/next）** — デフォルトテーマに存在せず、再現するにはレイアウト全体の自作（`ssg.render`）が必要

3つ目が最大の判断ポイント。prev/next と「UI文言の完全日本語化」はどちらもデフォルトテーマの限界で、解決策は同じ「カスタムJSXテーマの自作」に収束する。これを許容するなら完全再現は可能、テーマ自作を避けたいなら「prev/nextなし・一部UI文言が英語」という差分を受け入れることになる。

## 機能対応表

| # | 機能（現状） | 判定 | ox-content での再現方法 |
|---|---|---|---|
| A | サイドバー（8グループ・autogenerate・`sidebar.label`） | ⚙️ 設定 | `ssg.navigation` に明示列挙（ビルド前スクリプトで frontmatter から生成推奨） |
| B | 目次 h2–h3 | ✅ ビルトイン | `toc` デフォルトON、`tocMaxDepth: 3`（デフォルト値のまま） |
| C | `:::note` aside ×15 | 🔧 自作 | transformer で AST 変換（記法維持・JS不要）が第一候補 |
| D | Mermaid ×10（テーマ追従） | ⚙️ 設定 | `mermaid: true` + `@mermaid-js/mermaid-cli`。ビルド時静的SVG + CSS変数でテーマ追従 |
| E | ハイライト rust/wgsl/asm/llvm/toml/sh/text | ⚙️ 設定 | `highlight: true`（Shiki）。wgsl/asm/llvm も tm-grammars 収録済み |
| F | RustPlay ×45（実行・編集・Playground） | 🔧 自作 | アイランド機構で実現可。コンポーネント移植＋45箇所の書き換えが必要 |
| G | 日本語全文検索（Pagefind） | ✅ ビルトイン | BM25 検索がデフォルトON。CJK はユニグラムでトークナイズされ日本語で動作 |
| H | ダークモード＋カスタムCSS＋テーマ変数依存SVG ×7 | ⚙️ 設定 | 切替機構は同型（`[data-theme]`+`prefers-color-scheme`）。`--sl-color-*` → `--octc-*` へ書き換え |
| I | OGP メタタグ＋静的画像 | ⚙️ 設定 | `ssg.siteUrl` + `ssg.ogImage`（1行）。ビルトインのページ別OG画像生成で satori スクリプトの置換も可 |
| J | ja UI ロケール | 🔧 一部自作 | `lang=ja`・URL・検索 placeholder は設定可。「On this page」等の chrome 文言は英語ハードコード |
| K | 前後ページリンク・モバイルナビ | 🔧 自作 | **prev/next はデフォルトテーマに無い**。モバイルハンバーガーはビルトイン |
| L | 静的ビルド → `void deploy --dir dist` | ⚙️ 設定 | `vite build` → `dist/` 静的出力。ox-content 公式ドキュメント自体が void.app に同一手順でデプロイ実績あり |

✅ = そのまま動く ⚙️ = 設定・機械的書き換えで再現 🔧 = 公式拡張点での自作コードが必要

## 各項目の詳細

### A. サイドバー — 設定（明示列挙への書き換え）

`ssg.navigation`（`SsgNavigationGroup[] = { title, items: [{ title, path }] }`）で8グループを明示列挙する。APIリファレンス自身が「VitePress のような手書きナビからの移行用」と明言しており、autogenerate + frontmatter `sidebar.label` 相当の仕組みは無い（`navigation` 省略時のファイルツリー自動導出はあるが、ラベルは frontmatter `title` 由来になり「13. 数の表現」のような番号付きラベルや「Part I: CPUを知る」というグループ見出しは出せない）。

- **推奨**: ビルド前スクリプトで `src/content/docs/*` を glob → frontmatter の `sidebar.label` を読み取り → ディレクトリ→Part対応表でグループ化 → 数字プレフィックスでソートして navigation 配列を生成。frontmatter を単一情報源のまま維持できる。
- **既知の差分**: 現在サイドバー先頭にある**グループ外の単独リンク「はじめに → /」は `SsgNavigationGroup[]` では表現できない**（1項目グループにするとグループ見出しが1つ増える）。完全一致にはカスタムテーマでのサイドバー自作が必要。

### B. 目次 — ビルトイン

`tocMaxDepth: 3`（デフォルト）で h4 以下が除外され、Starlight の `maxHeadingLevel: 3` と同等。`minHeadingLevel` 相当は無いが h1 はページタイトル1個のみなので実質同等。差分: デフォルトの「On this page」に h1 エントリが含まれる。

### C. `:::note` — 自作（transformer 推奨）

directive/container/admonition 記法は ox-content のどのドキュメントにも存在しない（syntax-extensions は emoji / wikiLinks / attrs / cjkEmphasis の4つのみ。GFM はONだが GitHub 式 `> [!NOTE]` への言及も無し）。再現手段は3案:

1. **transformer（推奨・記法維持・JS不要）**: `oxContent({ transformers: [...] })` に `MarkdownTransformer` を書き、`:::note`〜`:::` の区間を aside 相当の HTML ノードに組み替える。15箇所・note のみなのでロジックは単純。CSS（枠・配色・「ノート」ラベル）は自前実装。
2. **Vue プラグインの `customBlocks`（要実機検証）**: `@ox-content/vite-plugin-vue` には `customBlocks`（デフォルト true、「Enable custom blocks in Markdown (e.g., :::tip)」）があり、Vue を選ぶ場合は**書き換え不要で通る可能性**がある。ただし記載はこの1行のみで対応タイプ・出力HTMLが未文書化。React/Svelte/Solid には同等オプション無し。
3. コンポーネント置換（`<Note>...</Note>`）: 可能だが island としてクライアントで hydrate されるため、静的な Starlight Aside と違い**ノート枠の描画が JS 依存になる**。非推奨。

### D. Mermaid — 設定

`mermaid: true` + devDependency `@mermaid-js/mermaid-cli`(mmdc) で、ビルド時に静的インラインSVG化（ランタイム mermaid.js 無し）。テーマ追従はプラグインCSSが SVG 内の色を `--octc-color-*` 変数で `!important` 上書きする方式で、ライト/ダーク切替に即時追従することを CSS 実物で確認済み。本書の10箇所は**全て flowchart**（CSS上書きが最も手厚い図種）なので実用上 astro-mermaid autoTheme と同等。

- 差分: 配色は mermaid の dark テーマではなくサイトテーマ準拠のニュートラル配色になる（統一感はむしろ向上）。
- **注意**: mmdc が見つからない場合**ビルドは失敗せず警告のみでフェンスがコードブロックのまま残る**（サイレントフォールバック）。void.app ビルド環境で mmdc（puppeteer/headless Chromium 依存）が動くかの実機確認と、ビルドログの警告チェックを移行時の必須確認項目にすること。

### E. コードハイライト — 設定

`highlight: true` で Shiki ベースのハイライトが有効化。rust/toml/sh/text は確実、**wgsl/asm/llvm も Shiki 公式グラマー集（tm-grammars）に収録済み**を確認。万一デフォルトで効かない言語があっても `highlightLangs` にグラマー登録で解決。ライト/ダーク両対応は `highlightTheme: "css-variables"`（theme-presets ではこれがデフォルト）でトークン色が `--octc-shiki-*` 変数になりテーマに追従。ファイル名ラベルは `codeAnnotations` の `[filename]` 記法で代替。`codeImports`（`<<< @/snippets/foo.rs`）は静的表示用途の `?raw` 完全代替になる（ただし RustPlay の実行機能の代替にはならない — F 参照）。Expressive Code のフレーム・コピーボタン等の見た目は同一にはならない。

### F. RustPlay — 自作（移植可能、作業量最大）

ox-content の公式コンポーネント機構（部分ハイドレーションのアイランド方式、全ページSPA化ではない）で、play.rust-lang.org へ fetch するインタラクティブコンポーネントは実現可能。ただし:

- **ox-content の `.mdx` は本物の MDX ではない**。`.md` と同一の Rust パーサで処理され、**import 文も JSX 式も解析されない**。props はリテラル（文字列/数値/真偽値/JSON）のみ。現在の `import code from '@snippets/x.rs?raw'` → `<RustPlay code={code} />` パターンは不可。
- **移行策**: `<RustPlay snippet="ch13/overflow" title="..." />` のようにスニペット名を文字列 prop で渡し、コンポーネント側で `import.meta.glob('/src/snippets/**/*.rs', { query: '?raw', import: 'default', eager: true })` で解決する（コンポーネントは通常の Vite モジュールなので `?raw` が使える。ドキュメント上の直接の裏付けは無いが Vite 標準機能）。
- 必要作業: (1) RustPlay.astro を React/Vue/Svelte/Solid のいずれかに移植（表示・実行・編集・Playground リンクの4機能はクライアントJSなのでロジックはほぼそのまま）。(2) 45箇所の import 行削除＋prop 書き換え（機械的置換スクリプトで可能）。(3) コード表示部のハイライトは Expressive Code 非互換のため再実装。
- 最適化: `<Island load="visible">` ラッパーで遅延ハイドレート可。フレームワークランタイム分、現状のゼロJS構成より配布JSは増える。

### G. 日本語検索 — ビルトイン（動作をコードレベルで確認済み）

検索はデフォルトON。Rust 製 BM25 インデックスを `search-index.json` として静的出力し、デフォルトテーマが検索UI（モーダル、ホットキー）を配線済み。**日本語対応は実物検証で確認**: 配信されている検索クライアントJSに CJK 文字（漢字・かな・カタカナ・ハングル）を1文字ずつトークン化するコードが実在し、実インデックスにも CJK ユニグラムが索引化されている。実インデックスに対する日本語クエリのシミュレーションでも正しいページが1位になることを確認（タイトル×10・見出し×5 のブーストが効く）。vite-plugin ドキュメントにも「Japanese/CJK Support: Proper tokenization for CJK characters」の明記あり。

- 差分: ユニグラム方式のため隣接性保証が無く、複数文字語クエリの精度は Pagefind よりやや落ちる可能性。「No results」等の文言は英語ハードコード（placeholder のみ設定可）。完全日本語UIが必要なら `virtual:ox-content/search` API で自作可。

### H. テーマ/カスタムCSS — 設定（変数名の全面書き換え）

ダークモード切替は Starlight と同型（ヘッダトグル→`[data-theme="dark"]`＋OS追従 `prefers-color-scheme`＋localStorage 永続化）なので、**テーマ変数依存の手書きSVG図7点は変数名の書き換えだけで両テーマ追従が維持される**。カスタムCSS は `defineTheme({ css })` に注入（`?raw` import で custom.css を読めば実質同等）。

- 作業: `--sl-color-*` → `--octc-color-*` の全面書き換え（custom.css、SVG 7ページ、RustPlay スタイル）。Starlight の gray-1〜7 のような細粒度グレースケールは無いため、既定8色にマップするか `tokens`/`darkTokens` で自前定義。
- 差分: 既定フォントが IBM Plex 系（現状はシステムフォント）なので、見た目維持には `fonts.sans/mono` の指定が必要。トグルが 3値（light/dark/auto）か2値かは未記載。

### I. OGP — 設定

`ssg.siteUrl` + `ssg.ogImage: '<URL>/ogp.png'` の設定だけで og:image / twitter:card メタタグが自動出力される（実ビルド出力で確認済み）。さらに `generateOgImage: true` でページ別OG画像のビルド時自動生成（カスタムテンプレート対応）があり、**satori+resvg の自前スクリプトを置き換え可能**。追加メタタグは `embed.head` スロットで注入可。開発中は `/__og-viewer` でプレビュー。`public/` 配信は Vite 標準の publicDir（SSG の outDir へのコピーは要実機確認）。

### J. ja UI — 一部自作

`i18n: { defaultLocale: 'ja', locales: [{ code: 'ja', name: '日本語' }] }` で全ページプレフィックス無し配信＋`<html lang="ja">` は再現可能。検索 placeholder も日本語化可能。ただし**デフォルトテーマの chrome 文言（「On this page」「Menu」「Theme」「No results」等）は英語ハードコード**で、Starlight の UI 翻訳に相当する設定は無い。完全日本語UIにはカスタムJSXテーマ（K と同じ解決策）が必要。

### K. 前後ページリンク — 最大のギャップ

**prev/next ページャはデフォルトテーマに存在しない**（ドキュメント全文に記載なし＋実ビルド済み20ページのHTMLにページャ要素ゼロを確認）。再現するには `ssg.render` にカスタムJSXテーマを渡し `useSiteConfig()`（navigation と全ページ情報を返す）から前後リンクを自前レンダリングする必要があるが、その場合「コンポーネントがドキュメント全体を所有」するためヘッダ・サイドバー・検索UI・head メタも全て自作になる。モバイルのハンバーガーナビはビルトイン（実HTMLで確認済み）。

### L. ビルド/デプロイ — 設定

`astro.config.mjs` → `vite.config.ts`（素の Vite でも vite-plus でも可、Node.js 24+）、`src/content/docs/` → `srcDir` へ移動、`.mdx` 拡張子はデフォルト処理対象。SSG デフォルトONで `dist/` に完全静的出力 → **`void deploy --dir dist` はそのまま使える**（ox-content 公式ドキュメント自体が `vp build` → `void deploy` で void.app に同一手順でデプロイされており互換は実証済み）。Astro からの自動移行ツールは無い（VitePress 用 CLI のみ）。frontmatter は自由形式（zod 的スキーマ検証は無い）。

## 移行を決める場合の推奨手順

1. **フレームワーク選定**（C と F の両方に効く）: Vue を選ぶと `customBlocks` で `:::note` が無変更で通る可能性がある（要事前検証）。通らなければ transformer 案に切替。バンドル最小なら Solid/Svelte。
2. **PoC（1日目安）**: 数ページで環境を組み、(a) `:::note` の出力、(b) mmdc がビルド環境で動くか、(c) wgsl/asm/llvm ハイライト、(d) 日本語検索品質、(e) `public/` コピー、の5点を実機確認。
3. RustPlay 移植＋45箇所の機械的書き換えスクリプト作成。
4. サイドバー生成スクリプト（frontmatter → `ssg.navigation`）作成。
5. custom.css / SVG 7ページの `--sl-*` → `--octc-*` 書き換え。
6. **完全再現を貫くなら**: カスタムJSXテーマを作成し prev/next＋日本語UI文言を実装（このコストを避けるなら prev/next 削除＋一部英語UIを受け入れる）。
7. 旧 Starlight URL（末尾スラッシュ）→ ox-content URL（`.html`）のリダイレクト検討。
8. `cjkEmphasis: true` の有効化を推奨（約物隣接の `**強調**` が素の CommonMark では効かないため、日本語書籍では移行時に強調が壊れる箇所が出得る）。

## 実装結果 (2026-08-24 追記)

本レポートの方針で移行を実装した。全機能の再現をE2Eテスト22項目で確認済み。
実装の過程で、ドキュメント調査では分からなかった以下の2点が判明し、方針を修正した。

1. **`transformers` オプションは v2.90.0 では未実装**(オプションとして解決される
   だけで実行箇所がない)。C項(`:::note`)のtransformer案は使えない。
2. **SSG はフレームワークコンポーネント(アイランド)を処理しない**。アイランドの
   ハイドレーションは「`.md` を Vue/React 等のコンポーネントとして import する
   SPA構成」専用で、SSG出力には配線されない。また SSG・検索・devサーバは
   Vite の transform を通らず `srcDir` をディスクから直接読む。

そのため F項(RustPlay)・C項(`:::note`)は、**ビルド前プリプロセッサ**
(`scripts/preprocess-docs.mjs`: `docs/` → `.ox-docs/` を生成して `srcDir` に指定)で
テキストレベルの展開を行う方式にした。RustPlay は静的HTML+コードフェンス
(ハイライトは ox-content 本体のパイプライン)に展開し、実行・編集・Playground
リンクは旧実装と同じ vanilla JS をテーマ `js` で全ページに注入する。
元の Starlight 実装も「静的HTML+素のJS」だったため、これが最も忠実な再現になる。
Vue 等のフレームワーク依存は不要になった。

その他の実装メモ:

- ビルドは素の Vite 8 で可能(vite-plus 不要)。スタブの `index.html` が必須
- SSG出力は `foo/index.html` のディレクトリ形式で、**旧StarlightのURLがそのまま維持される**
- 検索プレースホルダ等のUI文言はRustテンプレートにハードコードのため、
  `src/theme/ja-ui.js` がクライアント側で日本語化(J項の解決)
- wgsl/asm/llvm/toml はネイティブハイライト非対応のため `highlightLangs` に
  Shiki グラマーを登録(E項の想定通り)
- 手書きSVG図7点は **MDX時代のJSX式**(`{Array.from(...)}` 等)を含んでいたため、
  `scripts/render-figures.mjs` で一度だけ評価して静的SVGに変換した(調査時の
  見落とし。`--sl-color-*` 変数は互換レイヤーで `--octc-*` に接続し無変更で追従)
- frontmatter title は本文h1として描画されないため、プリプロセッサで
  `# タイトル` を先頭に注入
- mermaid は `PUPPETEER_EXECUTABLE_PATH` で headless Chromium を指定すれば
  ビルド時に静的SVG化される。mmdc 欠如時のサイレントフォールバック(警告のみで
  図がコードブロックのまま残る)は `scripts/verify-build.mjs` が検出し、
  **1図でも未レンダリングならビルドを失敗させる**(closeBundle で自動実行)
- prev/next ページャは `scripts/inject-pager.mjs` で実装した(2026-08-24 追加)。
  カスタムJSXテーマはヘッダ・サイドバー・検索UIの全自作とプリセットCSSの
  前提マークアップ喪失を招くため採用せず、**SSG完了後(closeBundle)に
  生成HTMLへ静的なページャを注入する**方式にした。順序はサイドバー定義
  (config/sidebar.mjs)と同一の単一情報源で、Starlight同様JS不要の静的HTML

## 調査方法

ox-content 公式ドキュメント全25ページを分野別に精読し（一次調査8並列）、クリティカル5項目（A/C/D/F/G）は別エージェントが反証目的で独立再検証。判定はすべてドキュメント本文の引用、または配信されている実物のJS/CSS/検索インデックス/ビルド済みHTMLの解析に基づく（憶測による「たぶん対応」は排除）。
## 3.0.0-alpha.1 調査 (2026-08-25 追記)

v3.0.0-alpha.1（2026-08-25 公開、npm dist-tag `alpha`。theme-holo / theme-color-github にも同バージョンあり）で、上記の自作部分の一部がビルトイン化された。5本柱は Stable Theme Packages(#700)・完全MDX(#701)・Code Play(#648)・opt-in docs-site built-ins(#650)・tree-sitter ハイライト(#702)。判定はリリースノート、GitHub issue/PR、および実装ソース（Rust crate / npm パッケージ）の直接確認に基づく。

### 自作部分の v3 対応表

| 自作部分 | v3 での置き換え | 判定 |
|---|---|---|
| `:::note` 展開 (preprocess-docs.mjs) | `containers` オプション (PR #707) | ✅ 完全置き換え可 |
| prev/next (inject-pager.mjs) | `ssg.pagination: true` (PR #713) | ✅ 完全置き換え可（ラベル英語） |
| RustPlay (rust-play.js + preprocess展開) | `@ox-content/code-play` 別パッケージ | △ 編集・Playgroundリンクが無い |
| ja-ui.js（UI文言日本語化） | 無し | ❌ 継続（対象はむしろ増える） |
| h1 注入 (preprocess-docs.mjs) | 無し（v3テンプレートも本文h1を出さない） | ❌ 継続 |
| verify-build.mjs（mermaid検出） | 変更なし | ❌ 継続 |
| sidebar.mjs / generate-ogp.ts | 変更なし | ❌ 継続 |
| `highlightLangs`（wgsl/asm/llvm/toml） | **オプション自体が削除** | 🚫 退行（下記ブロッカー） |

### 確認済みの詳細

- **containers**: `containers: true` で `::: tip/note/info/important/warning/danger/caution/details` の8種が有効。パーサ（`crates/ox_content_transform/src/features/containers/parse.rs`）は `:::` 直後の空白を trim してから `[` で名前を区切るため、**本書の `:::note[タイトル]`（スペース無し・ブラケット題）はそのまま通る**（テストケースで確認）。`containers: { types: { note: { title: "ノート" } } }` でビルトイン型の既定ラベルを上書き可能（`resolve()` が同キー insert で上書きする実装を確認）。出力は `<div class="ox-container ox-container-note"><p class="ox-container-title">…` で現行の `<aside>` と異なるため CSS の移植が必要。
- **pagination**: `ssg.pagination: true`。順序はサイドバーを depth-first に平坦化したもので、現行 inject-pager.mjs と同じ「sidebar.mjs = 単一情報源」の設計がそのまま成立。frontmatter で `prev: false` / `{ text, link }` の個別上書き可。ラベル `Previous` / `Next` は SSG テンプレート（`crates/ox_content_ssg/templates/page.html`）に英語ハードコードのため ja-ui.js での日本語化対象に追加。
- **Code Play**: `@ox-content/code-play@alpha`（新規パッケージ・二重opt-in）。` ```rust play typecheck ` フェンスメタだけでウィジェット化。Rust は play.rust-lang.org へブラウザから直接 POST（現行 rust-play.js と同方式。`endpoints.rust` で上書き可）。SSG 出力へのハイドレートは CI 実証済み（PR #711）、SSG後に outDir の HTML を強化し自己完結クライアント `ox-code-play.js` を配布。UI は Run / Typecheck / Cancel + stdio / stderr / config / provenance / timing タブ。**ただし ui.ts / hydrate.ts を確認した結果、コード編集（textarea）と「Playground で開く」リンクは無い**。現行 RustPlay の4機能（表示・実行・編集・Playgroundリンク）のうち後ろ2つが落ちる。採用する場合 preprocess の RustPlay 展開は「` ```rust play ` フェンスへの展開」に簡素化できる。
- **ハイライト（最大のブロッカー）**: Shiki 完全廃止・tree-sitter 一本化（PR #710 / issue #702）。`highlightLangs` / `highlightTheme` は削除。バンドル文法は bash/c/cpp/css/go/html/java/js/json/md/python/rust/ts/yaml のみ（`crates/ox_content_highlight/Cargo.toml` で確認）。**wgsl・asm・llvm・toml は全てプレーンテキストになる**。#702 で「カスタム文法のユーザー登録は 3.0 スコープ外。需要のある言語は in-repo で追加」と明記。CSS 変数契約（`--octc-shiki-*`・`class="shiki"`）は互換維持。
- **UI文言 / i18n**: v3 テンプレートでも chrome 文言（On this page / Search / Menu / Theme / Previous / Next / Last updated）は英語ハードコード。新しい MF2 i18n 辞書機構（`i18n.md`）はコンテンツ翻訳用でテーマ chrome には配線されていない。ja-ui.js 継続、新 chrome（ページャ・パンくず・コピーボタン等）を使うほどパッチ対象が増える点に注意。
- **その他の変更点**: 右カラム目次（aside）が opt-in 化（PR #715、`ThemeOptions.aside` 省略/false で非表示 → 移行時は明示 `aside: true` が必要か要確認）。`.mdx` で本物の MDX（import/export・JSX・island props・markdown children、PR #788 ほか）が入ったが、現行の .md + preprocess 構成には不要。mermaid のサイレントフォールバック挙動は変更なし。
- **新規に無料で得られるもの**: math・includes・badges・file-tree・steps・cards・figures、sitemap/robots/llms.txt、feeds、redirects、404、drafts、permalinks/frontmatter cascade、breadcrumbs、コピー/外部リンク/back-to-top、header nav・announcement bar（PR #750）、locale switcher、taxonomies、docs versioning、hosted search adapter（すべて opt-in・デフォルトOFF）。

### 判定

- **3.0 安定版で置き換え確定候補**: containers（`:::note`）と `ssg.pagination`。preprocess-docs.mjs は「RustPlay展開 + h1注入」だけに縮小、inject-pager.mjs は削除できる。
- **判断ポイント**: Code Play への乗り換えは「編集」「Playgroundリンク」の2機能を捨てられるか次第。捨てないなら rust-play.js 継続（併存は UI が2系統になり歪）。
- **移行ブロッカー**: tree-sitter 文法に wgsl/asm/llvm/toml が無い限り、GPU 本としてハイライトの退行が致命的。upstream への文法追加リクエスト（特に wgsl / toml）が先決。
- alpha.1 は公開初日。検証は preview 環境（`deploy:preview`）で行い、本番は安定版 + 文法追加を待つ。

## 3.0.0-alpha.1 実装結果 (2026-08-25 追記)

上記調査の方針で v3.0.0-alpha.1 への移行を実装した(ブランチ ox-content-v3)。
ユーザー決定: (1) wgsl/asm/llvm/toml は自前 Shiki 後処理でハイライト維持、
(2) RustPlay は Code Play へ置き換え(編集・Playground リンクの喪失を許容)。
e2e 32項目全PASS。ビルド実測: 31ページ / play 45(全ラップ・42パッチ) /
note 15 / mermaid 10 / pager 31 / フォールバックハイライト 17ブロック。

### 構成の変化

| 部位 | v2.90 (自作) | v3.0.0-alpha.1 |
|---|---|---|
| `:::note` | preprocess で `<aside>` 展開 | `containers: { types: { note: { title: 'ノート' } } }`。記法無変更 |
| prev/next | inject-pager.mjs(削除) | `ssg.pagination: true` + custom.css でカード型に再現 |
| RustPlay | rust-play.js(削除)+ preprocess 展開 | `@ox-content/code-play`。preprocess は ```rust play フェンス展開に簡素化 |
| 右カラム目次 | デフォルトON | v3 で opt-in 化 → テーマ層に `aside: true` |
| wgsl/asm/llvm/toml | `highlightLangs`(v3で削除) | scripts/highlight-fallback.mjs(SSG後に Shiki css-variables で置換) |
| UI文言 | ja-ui.js | 継続。pager(Previous/Next)と Code Play(Run/Typecheck/Cancel)を追加、MutationObserver で再描画へ追従 |

### 新規スクリプトと回避策(v3 の制約由来)

1. **scripts/patch-code-play.mjs** — code-play の widget config はグローバル
   設定しか無く、`mode="release"`(42箇所)と debug 必須の ch01/cpu-speed・
   ch13/overflow、nightly 必須の ch04/nightly-simd を再現できない。
   preprocess がページ別・出現順の manifest (.ox-docs/code-play-manifest.json)
   を書き出し、SSG 後に `<ox-code-play>` の base64 payload へ config を反映する。
   同一スニペットを debug/release で使い分ける ch01 があるため、コード内容
   ではなく出現順で突き合わせる。ズレはビルド失敗にする。
2. **normalizeEntities (patch-code-play.mjs 内)** — SSG は本文の `<`/`&` の
   一部を16進エンティティ(`&#x3C;`/`&#x26;`)で出力するが、code-play の
   SSG マッチング(decodeHtml)は名前付きエンティティしか解さず、該当コードを
   含む play フェンスがラップされない(45箇所中2箇所で発生)。codePlay の
   closeBundle より前に等価な名前付きエンティティへ正規化して回避。
   **upstream に報告する価値あり**。
3. **scripts/highlight-fallback.mjs** — tree-sitter 文法一覧(bash/c/cpp/css/
   go/html/java/js/json/md/python/rust/ts/yaml)に無い言語は
   `<pre><code class="language-*">` のまま残るため、Shiki の
   createCssVariablesTheme(prefix `--octc-shiki-`、crates/ox_content_highlight/
   src/theme.rs と同一のフォールバック表)で本体と同一契約の markup に置換。
   **upstream が wgsl/toml 文法を追加したら削除できる**。

### 既知の差分・注意点

- **編集・Playground リンクは廃止**(Code Play 未対応のため)。代わりに
  型チェック・stderr ビューア(タイムスタンプ付き)・タイムアウト・中断・
  timing/provenance タブを獲得。debug ビルドの overflow panic も stderr に
  赤字で表示され、教材としてはむしろ情報量が増えた
- **pager リンクは `/index.html` 付き**(サイドバーと同形式。旧自作 pager
  のみクリーン URL だった)。e2e の期待値を更新済み
- **dev サーバでは patch-code-play が効かない**(closeBundle はビルドのみ)。
  dev 中の widget は全てカタログ既定値(stable/debug)で動く。nightly スニペットを
  dev で実行するとエラーになるが、config タブから手動で切り替え可能
- ビルドには `PUPPETEER_EXECUTABLE_PATH`(mermaid 用、従来通り)が必要
- `[ox-content:i18n] Dictionary directory not found: content/i18n` の警告が
  出るが無害(v3 の MF2 辞書機構は未使用)
- フェンスは 3 連バッククォートに変更(スニペットにバッククォートが無いことを
  確認済み。旧実装の 5 連は HTML ブロック内包のための保険だった)

### 追記: stdio 表示の調整 (src/theme/play-output.js)

Rust Playground は正常実行でも cargo のビルドログ(Compiling/Finished/Running)を
stderr で返す。Code Play は (1) stderr チャンクを赤字表示し、(2) stderr が空で
ない限り実行後に stderr タブへ自動切替するため、**正常実行が毎回エラー画面に
見える**(旧 rust-play.js はこのノイズをフィルタしていた)。テーマ JS の
play-output.js で旧実装と同じパターンをフィルタし、フィルタ後に stderr が
実質空(本物のエラーなし)なら stdio タブへ戻す。本物の panic やコンパイル
エラーは残り、その場合は stderr タブ着地のまま(エラーが即座に見える)。
実装注意: `.ox-code-play__stdio-line` はウィジェット CSS が display:grid を
持つため hidden 属性では消えず、inline style で display:none にする必要がある。
これも upstream に報告する価値あり(正常実行で stderr タブに着地する挙動)。
