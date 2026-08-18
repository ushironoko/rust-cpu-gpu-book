# RustではじめるCPUとGPU

Webアプリケーション開発者のための、RustでたどるCPU・GPUの教科書。
Astro Starlight (MDX) 製のドキュメントサイトです。

- 基礎編12章 + 応用編16章 + 用語集。
  基礎編: CPUの仕組み(Part I)、Rustコンパイラと最適化(Part II)、GPU(Part III)。
  応用編: CPUとメモリの深層(Part IV)、Rustの深層(Part V)、GPUの深層(Part VI)、システムと実践(Part VII)
- 本文中のRustコードの多くは、ブラウザ上から [Rust Playground](https://play.rust-lang.org/) で**その場で実行・編集**できます
- 図はmermaidとインラインSVG。実測値はすべて実際に計測したものです

## 開発

```sh
bun install
bun run dev      # 開発サーバ
bun run build    # dist/ へ静的ビルド
bun run preview  # ビルド結果の確認
```

## 構成

```
src/content/docs/   # 本文 (MDX)
  cpu/              #   Part I   CPUを知る (1-5章)
  rust-opt/         #   Part II  Rustと最適化 (6-8章)
  gpu/              #   Part III GPUを知る (9-12章)
  appendix/         #   用語集・さらに学ぶには
src/snippets/       # 実行可能なRustコード (表示・実行・コンパイル検証の単一ソース)
src/components/     # RustPlay.astro (Playground実行コンポーネント)
examples/           # ローカル実行用Cargoワークスペース (criterion / wgpu)
scripts/play.sh     # スニペットをPlayground APIで実行するスクリプト
```

## examples の実行

GPUを使う章(11・12章)のコードはブラウザでは動かないため、
ローカルで実行します。

```sh
cd examples
cargo run --release -p ch11-vector-add     # wgpu ベクトル加算
cargo run --release -p ch12-matmul         # 行列積 CPU 3方式 + GPU 3方式
cargo bench -p ch08-bench                  # criterion ベンチ
```

## スニペットの検証

`src/snippets/` 以下の全コードは `rustc --edition 2024` でコンパイルが通ります
(`nightly-` プレフィックスのものは nightly)。

```sh
for f in src/snippets/*/*.rs; do rustc --edition 2024 --crate-type bin -O -o /tmp/check "$f"; done
```
