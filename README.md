# RustではじめるCPUとGPU

Webアプリケーション開発者のための、RustでたどるCPU・GPUの教科書。
[ox-content](https://ox-content.void.app/) 製のドキュメントサイトです。

**📖 公開サイト: https://rust-cpu-gpu-book.void.app**

- **基礎編12章 + 応用編16章 + 用語集(約180語)** の全28章構成
- 本文中のRustコードの多くは、ブラウザ上から
  [Rust Playground](https://play.rust-lang.org/) で**その場で実行・編集**できます
- 図はmermaidとインラインSVG。本文の実測値は、すべて実際に
  計測したものです(後述の「実測環境」参照。どちらの環境かは本文に明記)

## 実測環境

本文の「筆者の実測」は、次の2つの環境で2026年8月に計測したものです。

| 環境 | 主な用途 | 詳細 |
| --- | --- | --- |
| Rust Playground | ブラウザ実行可能なスニペット全般 | play.rust-lang.org の共有x86-64 Linux環境(2 vCPU、メモリ上限あり)。stableのreleaseビルドを基本とし、debug/nightlyを使う箇所は本文に明記。共有環境のため実行ごとに数十%ばらつく |
| 手元のMac | wgpu/BLAS/criterionなどローカル実行のexamples | Apple M4 (CPU 10コア = P4+E6、GPU 10コア、ユニファイドメモリ32GB)、macOS 26.3、rustc 1.95.0、wgpu 30.0.0 |

倍率や傾向は環境が変われば変わります(本文23章では、環境差で
教科書の定石が覆る例も扱っています)。手元での再計測を推奨します。

## 読む / 開発する

公開サイト https://rust-cpu-gpu-book.void.app でそのまま読めます。
手元で動かす場合:

```sh
bun install
bun run dev      # 開発サーバ (http://localhost:5173)
bun run build    # dist/ へ静的ビルド
bun run preview  # ビルド結果の確認
bun run deploy   # void で Cloudflare Workers へデプロイ

# mermaid図のビルドには headless Chromium が必要です。
# ブラウザが自動検出できない環境では実行ファイルを指定してください:
#   PUPPETEER_EXECUTABLE_PATH=/path/to/chromium bun run build
```

## 目次

**基礎編**: 前提知識ゼロから、最短経路で「仕組みで速度を説明できる」状態に到達することを目指します

| Part | 章 |
| --- | --- |
| I CPUを知る | 1 プログラムはどう動くか / 2 メモリ階層とキャッシュ / 3 パイプラインと分岐予測 / 4 SIMDとベクトル化 / 5 マルチコアと並列処理 |
| II Rustと最適化 | 6 コンパイラがしていること / 7 ゼロコスト抽象化の実際 / 8 計測してから最適化する |
| III GPUを知る | 9 GPUという計算機 / 10 GPUのメモリと転送 / 11 RustからGPUを使う / 12 CPUとGPUを使い分ける |

**応用編**: 体系を完成させるための主題です。関心のある章から独立して読めます

| Part | 章 |
| --- | --- |
| IV CPUとメモリの深層 | 13 数の表現 / 14 仮想メモリとTLB / 15 キャッシュの内部構造 / 16 フロントエンドとtop-down分析 / 17 メモリモデルと並行データ構造 |
| V Rustの深層 | 18 アロケータ / 19 asyncの実体 / 20 unsafeと未定義動作とFFI / 21 ビルドを極める / 22 データ構造の実性能 |
| VI GPUの深層 | 23 カーネル最適化の体系 / 24 転送と実行の重ね合わせ / 25 行列エンジンと混合精度 / 26 GPUの計測 |
| VII システムと実践 | 27 OSの層のコスト / 28 実践の性能工学(+知識の地図) |

## リポジトリ構成

```
docs/               # 本文 (Markdown)
  cpu/              #   Part I   CPUを知る (1-5章)
  rust-opt/         #   Part II  Rustと最適化 (6-8章)
  gpu/              #   Part III GPUを知る (9-12章)
  cpu-deep/         #   Part IV  CPUとメモリの深層 (13-17章)
  rust-deep/        #   Part V   Rustの深層 (18-22章)
  gpu-deep/         #   Part VI  GPUの深層 (23-26章)
  systems/          #   Part VII システムと実践 (27-28章)
  appendix/         #   用語集・さらに学ぶには
src/snippets/       # 実行可能なRustコード (表示・実行・検証の単一ソース)
src/theme/          # カスタムCSS / RustPlayクライアントJS / UI日本語化JS
config/sidebar.mjs  # frontmatter からサイドバーを生成
scripts/preprocess-docs.mjs  # :::note と <RustPlay> を展開して .ox-docs/ へ出力
examples/           # ローカル実行用Cargoワークスペース (wgpu / criterion / BLAS)
scripts/play.sh     # スニペットをPlayground APIで実行・検証するスクリプト
scripts/generate-ogp.ts  # OGP画像の生成 (satori + resvg、bun run ogp)
```

## examples の実行

GPUやOSライブラリを使う章のコードはブラウザでは動かないため、
ローカルで実行します(wgpu系はGPUのあるマシンが必要です)。

```sh
cd examples
cargo run --release -p ch11-vector-add   # 11章: wgpu ベクトル加算
cargo run --release -p ch12-matmul       # 12章: 行列積 CPU 3方式 + GPU 3方式
cargo run --release -p ch23-reduction    # 23章: GPU reduction 3段階
cargo run --release -p ch24-overlap      # 24章: 同期点の削減で2.7倍
cargo run --release -p ch25-gemm-lib     # 25章: Accelerate(BLAS)との比較 (macOS専用)
cargo run --release -p ch26-timestamp    # 26章: GPUタイムスタンプ計測
cargo bench -p ch08-bench                # 8章: criterion ベンチ
```

## スニペットの検証

`src/snippets/` のコードは表示・ブラウザ実行・検証の単一ソースです。

- 標準ライブラリのみのスニペットは `rustc --edition 2024` で
  そのままコンパイルできます(`nightly-` プレフィックスのものはnightly)
- クレートやOSライブラリに依存するもの(rayon / tokio / libc)は、
  Playground実行スクリプトで検証します

```sh
# 標準ライブラリのみのスニペットのコンパイル検証
for f in src/snippets/*/*.rs; do
  rustc --edition 2024 --crate-type bin -O -o /tmp/check "$f" || echo "skip(要クレート): $f"
done

# Playground APIでの実行 (依存クレートつきのものもこちらで動く)
bash scripts/play.sh src/snippets/ch05/rayon.rs release
```
