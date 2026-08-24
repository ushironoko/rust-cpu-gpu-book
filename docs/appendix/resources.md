---
title: さらに学ぶには
description: 本書の先へ進むための書籍、ドキュメント、ツールの案内。
sidebar:
  label: さらに学ぶには
---

本書で扱った各分野を深めるための、評価の定まった資料を挙げます。

## コンピュータアーキテクチャ全般

- **『コンピュータシステムの理論と実装』/ CS:APP**:
  英語では *Computer Systems: A Programmer's Perspective* (Bryant & O'Hallaron)です。
  プログラマの視点でハードウェアを学ぶ標準的な教科書です。
  本書のPart Iを体系的に深めたい場合の第一候補です
- [**What Every Programmer Should Know About Memory**](https://people.freebsd.org/~lstewart/articles/cpumemory.pdf)
  (Ulrich Drepper): メモリ階層とキャッシュについての古典的な論文です。
  2007年の文書ですが、2章の内容の原典として今も読む価値があります
- [**Agner Fog's optimization manuals**](https://www.agner.org/optimize/):
  x86の命令レイテンシ表や最適化技法を網羅した資料です。
  アセンブリレベルの最適化を行う場合に参照します

## Rustの性能

- [**The Rust Performance Book**](https://nnethercote.github.io/perf-book/):
  Rustの性能改善手法を簡潔にまとめた無料の電子書籍です。
  本書のPart IIを実務面から補完します
- [**Rust Atomics and Locks**](https://marabos.nl/atomics/) (Mara Bos):
  5章で「1冊の本になる」と書いた、アトミックとメモリオーダリングを
  扱う書籍です。無料で公開されています
- [**The Rustonomicon**](https://doc.rust-lang.org/nomicon/):
  unsafe Rustの公式ガイドです。`get_unchecked`などを使う前に読む資料です

## 計測ツール

- [criterion](https://github.com/bheisler/criterion.rs): ベンチマーク(8章)
- [samply](https://github.com/mstange/samply): プロファイラ(8章)
- [cargo-show-asm](https://github.com/pacak/cargo-show-asm): アセンブリ表示(8章)
- [Compiler Explorer](https://godbolt.org/): ブラウザでアセンブリ確認(1章)
- [cargo-flamegraph](https://github.com/flamegraph-rs/flamegraph): フレームグラフ生成

## GPU

- [**WebGPU仕様**](https://www.w3.org/TR/webgpu/) /
  [**WGSL仕様**](https://www.w3.org/TR/WGSL/): 一次情報です
- [**Learn wgpu**](https://sotrh.github.io/learn-wgpu/):
  wgpuの標準的なチュートリアルです。グラフィックス寄りですが、
  11章の先へ進むのに適しています
- [**wgpu公式サンプル**](https://github.com/gfx-rs/wgpu/tree/trunk/examples):
  本書のコードもここのhello-computeを出発点にしています
- **CUDA C++ Programming Guide** (NVIDIA): CUDAに進む場合の一次資料です。
  ワープ、共有メモリ、コアレッシングなど、9〜10章の概念の
  NVIDIA版の詳細を学べます
- [**burn**](https://burn.dev/) / [**candle**](https://github.com/huggingface/candle):
  Rustの機械学習フレームワークです。目的が行列演算の高速化だけなら、
  自作カーネルより先にこちらを検討してください

## 応用編の先へ

- **Computer Architecture: A Quantitative Approach** (Hennessy & Patterson):
  アーキテクチャを定量的に扱う標準的な教科書です。Part IVの内容を深められます
- [**Operating Systems: Three Easy Pieces**](https://pages.cs.wisc.edu/~remzi/OSTEP/)
  (OSTEP): 仮想メモリ(14章)とOSの層(27章)を体系的に学べる、
  無料公開の教科書です
- **Systems Performance** (Brendan Gregg): 27〜28章の実務面
  (計測・OS・クラウド)を網羅した書籍です
- **Programming Massively Parallel Processors** (Hwu, Kirk & Hajj):
  Part VIのカーネル最適化をCUDAで深める標準的な教科書です
- [**Async Book**](https://rust-lang.github.io/async-book/) /
  [tokioチュートリアル](https://tokio.rs/tokio/tutorial): 19章の先の
  asyncの実務を扱います
- [crossbeam](https://github.com/crossbeam-rs/crossbeam): 17章で扱った
  ロックフリー構造の既存実装です
- [HdrHistogram](https://github.com/HdrHistogram/HdrHistogram_rust):
  28章のレイテンシ分布の計測に広く使われるライブラリです
- [iai-callgrind](https://github.com/iai-callgrind/iai-callgrind):
  命令数に基づく、ばらつきの小さいベンチマークツールです(28章)

## 本書のコードについて

本書のすべての実行可能コードは、リポジトリの`src/snippets/`
(ブラウザ実行対応)と`examples/`(ローカル実行、GPU含む)にあります。
数値は筆者の環境(Apple M4 / Rust Playground)での実測であり、
環境が違えば数値も変わります。手元で再計測してください。
再計測そのものが、8章で学んだことの実践です。
