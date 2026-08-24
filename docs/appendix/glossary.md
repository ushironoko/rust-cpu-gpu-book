---
title: 用語集
description: 本書で登場した専門用語の定義集。カテゴリ別に、初出の章へのリンク付きでまとめる。
sidebar:
  label: 用語集
---

本書で定義した専門用語を分野別にまとめました。
括弧内は英語表記、末尾のリンクは初出の章です。

## 計算の基本

- **CPU**(central processing unit): メモリ上の命令を順に読み取り
  実行する、コンピュータの中心装置。[1章](/cpu/01-how-code-runs/)
- **メモリ**(memory): 命令とデータを置く記憶装置。本書では主に
  メインメモリ(DRAM)を指す。[1章](/cpu/01-how-code-runs/)
- **命令**(instruction): 「足す」「読む」など、CPUが実行する
  最小単位の操作指示。[1章](/cpu/01-how-code-runs/)
- **機械語**(machine code): 命令を0と1の並びで表した、
  CPUが直接実行する形式。[1章](/cpu/01-how-code-runs/)
- **アセンブリ**(assembly): 機械語の命令を人間が読める記法で
  1対1に書き直した表現。[1章](/cpu/01-how-code-runs/)
- **命令セット**(instruction set architecture、ISA): CPUが受け付ける
  命令の種類と形式の取り決め。x86-64、ARM64など。[1章](/cpu/01-how-code-runs/)
- **オペランド**(operand): 命令が操作する対象。レジスタ、定数、
  メモリ上の位置など。`add w0, w1, w0`ならw1とw0が入力、
  先頭のw0が書き込み先のオペランド。[1章](/cpu/01-how-code-runs/)
- **レジスタ**(register): CPU内部にある少数・最速の記憶場所。
  計算は原則レジスタ上で行われる。[1章](/cpu/01-how-code-runs/)
- **レジスタ割り付け**(register allocation): どの変数をどのレジスタに
  割り当てるかを決めるコンパイラの処理。[1章](/cpu/01-how-code-runs/)
- **フェッチ**(fetch)/**デコード**(decode)/**実行**(execute):
  命令処理の3段階。メモリから読み、解釈し、実行する。[1章](/cpu/01-how-code-runs/)
- **クロック周波数**(clock frequency): CPUの動作周期の速さ。
  3GHzなら毎秒30億サイクル。[1章](/cpu/01-how-code-runs/)
- **呼び出し規約**(calling convention): 関数の引数と戻り値を
  どのレジスタで受け渡すかの取り決め。OSとISAごとに決まっている。[1章](/cpu/01-how-code-runs/)
- **debugビルド/releaseビルド**: 最適化なし(検査あり)/最適化ありの
  コンパイル設定。性能の話はreleaseビルドが前提。[1章](/cpu/01-how-code-runs/)

## メモリとキャッシュ

- **レイテンシ**(latency): 要求してから最初の結果が届くまでの時間。[2章](/cpu/02-memory-hierarchy/)
- **帯域幅**(bandwidth): 単位時間あたりに転送できるデータ量。[2章](/cpu/02-memory-hierarchy/)
- **DRAM**(dynamic RAM): メインメモリに使われる大容量・低速のメモリ。
  レイテンシは約100ナノ秒。[2章](/cpu/02-memory-hierarchy/)
- **SRAM**(static RAM): キャッシュに使われる高速・高価なメモリ。[2章](/cpu/02-memory-hierarchy/)
- **キャッシュ**(cache): 最近使ったデータの写しを置く小容量・高速の
  メモリ。CPUに近い順にL1/L2/L3がある。[2章](/cpu/02-memory-hierarchy/)
- **キャッシュヒット**(cache hit)/**キャッシュミス**(cache miss):
  目的のデータがキャッシュにある/ない状態。[2章](/cpu/02-memory-hierarchy/)
- **キャッシュライン**(cache line): キャッシュとメモリの転送単位。
  x86-64では64バイトが標準的(Apple Silicon等では128バイト)。[2章](/cpu/02-memory-hierarchy/)
- **プリフェッチ**(prefetch): アクセスの規則性を検出し、要求前に
  データを先読みするハードウェアの仕組み。[2章](/cpu/02-memory-hierarchy/)
- **空間的局所性**(spatial locality): 使ったデータの近くを続けて
  使う性質。キャッシュラインを有効に使う条件。[2章](/cpu/02-memory-hierarchy/)
- **時間的局所性**(temporal locality): 同じデータを短い間隔で
  繰り返し使う性質。[2章](/cpu/02-memory-hierarchy/)
- **ポインタチェイシング**(pointer chasing): 読んだ値が次に読む場所を
  決めるアクセス列。プリフェッチ不能でレイテンシが直列に累積する。[2章](/cpu/02-memory-hierarchy/)
- **アラインメント**(alignment): 型ごとに決まる「置いてよいアドレスの
  単位」。[2章](/cpu/02-memory-hierarchy/)
- **パディング**(padding): アラインメントを満たすために挿入される
  隙間のバイト。[2章](/cpu/02-memory-hierarchy/)
- **AoS**(array of structs)/**SoA**(struct of arrays): 構造体の配列/
  フィールドごとの配列。SoAは走査とSIMD・GPUに有利。[2章](/cpu/02-memory-hierarchy/)
- **ヒープ確保**(heap allocation): 実行時にメモリ領域を動的に
  確保すること。`Vec`の伸長などで発生し、性能上の主要コストになりやすい。[7章](/rust-opt/07-zero-cost/)

## CPUの実行の仕組み

- **パイプライン**(pipeline): 命令の処理段階を重ねて流れ作業にする
  仕組み。[3章](/cpu/03-pipeline/)
- **ハザード**(hazard): パイプラインの進行を妨げる要因。データ依存に
  よるものと分岐によるものがある。[3章](/cpu/03-pipeline/)
- **ストール**(stall): ハザードによってパイプラインが待ちに入ること。[3章](/cpu/03-pipeline/)
- **分岐**(branch): `if`やループの実体である条件付きジャンプ命令。[3章](/cpu/03-pipeline/)
- **分岐予測器**(branch predictor): 分岐の行き先を履歴から予測する
  ハードウェア。[3章](/cpu/03-pipeline/)
- **投機実行**(speculative execution): 予測に基づき、確定前に命令を
  実行する方式。予測が外れた場合は結果を破棄する。[3章](/cpu/03-pipeline/)
- **ブランチレス**(branchless): 分岐を算術や条件付き移動に置き換えた
  コード。予測不能な分岐のコストを避ける。[3章](/cpu/03-pipeline/)
- **条件付き移動**(conditional move): 条件に応じて値を選ぶ、
  分岐しない命令。[3章](/cpu/03-pipeline/)
- **if変換**(if-conversion): コンパイラが分岐を条件付き移動などの
  計算に置き換える最適化。[3章](/cpu/03-pipeline/)
- **スーパースカラ**(superscalar): 1サイクルに複数の命令を発行・実行
  する方式。[3章](/cpu/03-pipeline/)
- **アウトオブオーダー実行**(out-of-order execution): 記述順でなく
  依存が解決した順に命令を実行する方式。[3章](/cpu/03-pipeline/)
- **命令レベル並列性**(instruction-level parallelism、ILP): 命令列に
  含まれる「同時に実行できる度合い」。[3章](/cpu/03-pipeline/)
- **IPC**(instructions per cycle): 1サイクルあたりの実行命令数。[3章](/cpu/03-pipeline/)

## SIMD

- **SIMD**(single instruction, multiple data): 1命令で複数のデータを
  同時に計算する方式。[4章](/cpu/04-simd/)
- **ベクトルレジスタ**(vector register): SIMD用の幅広レジスタ。
  SSE2は128ビット、AVX2は256ビット。[4章](/cpu/04-simd/)
- **SSE2/AVX/AVX-512/NEON**: SIMD命令の拡張の系統。SSE2はx86-64全CPU、
  NEONはARM64全CPUが対応し、AVX系は対応CPU限定。[4章](/cpu/04-simd/)
- **レーン**(lane): ベクトルレジスタ内の1区画。[4章](/cpu/04-simd/)
- **portable SIMD**(`std::simd`): CPUの種類によらず書ける
  RustのSIMD API(2026年時点でnightly)。[4章](/cpu/04-simd/)
- **自動ベクトル化**(auto-vectorization): コンパイラがループをSIMD命令に
  変換する最適化。[4章](/cpu/04-simd/)
- **イントリンシック**(intrinsic): CPU命令に直結した関数(`std::arch`)。[4章](/cpu/04-simd/)
- **実行時機能検出**(runtime feature detection): 実行中のCPUが持つ
  命令拡張を実行時に調べること。[4章](/cpu/04-simd/)

## 並列とマルチコア

- **コア**(core): CPU内の独立した実行装置。[5章](/cpu/05-multicore/)
- **SMT**(simultaneous multithreading): 1コアに複数の命令の流れを
  混在させる技術。Hyper-Threadingなど。[5章](/cpu/05-multicore/)
- **スレッド**(thread): OSが管理する命令の流れの単位。[5章](/cpu/05-multicore/)
- **並行**(concurrency)/**並列**(parallelism): 複数の処理を交互に
  進める構造/文字どおり同時に実行すること。[5章](/cpu/05-multicore/)
- **キャッシュコヒーレンス**(cache coherence): コアごとのキャッシュ間で
  データの一貫性を保つ仕組み。書き込みにはラインの所有権の取得が必要で、コア間で競合する。[5章](/cpu/05-multicore/)
- **false sharing**(偽共有): 別々の変数が同じキャッシュラインに載り、
  無関係な書き込み同士が競合する現象。[5章](/cpu/05-multicore/)
- **データ競合**(data race): 同期なしの並行アクセスで少なくとも一方が
  書き込みである状態。Rustはコンパイル時に排除する。[5章](/cpu/05-multicore/)
- **アトミック操作**(atomic operation): 途中に割り込まれない読み書き。[5章](/cpu/05-multicore/)
- **メモリオーダリング**(memory ordering): アトミック操作の前後で、
  他の読み書きの順序をどこまで保証するかの指定。[5章](/cpu/05-multicore/)
- **データ並列**(data parallelism): 大量の要素それぞれに独立な計算を
  する形の並列性。[5章](/cpu/05-multicore/)
- **ワークスティーリング**(work stealing): 待機状態になったスレッドが
  他のスレッドの未処理分を引き取って負荷を均等化する方式。rayonが採用。[5章](/cpu/05-multicore/)
- **Amdahlの法則**(Amdahl's law): 並列化できない部分が全体の高速化の
  上限を決めるという法則。[5章](/cpu/05-multicore/)

## コンパイラとRust

- **中間表現**(intermediate representation、IR): コンパイラ内部の
  プログラム表現。rustcのMIR、LLVM IRなど。[6章](/rust-opt/06-compiler/)
- **LLVM**: 多数の言語が共有するコンパイラ基盤。Rustの速度最適化の
  大半を担う。[6章](/rust-opt/06-compiler/)
- **定数畳み込み**(constant folding): コンパイル時に計算できる式を
  コンパイル時に計算する最適化。[6章](/rust-opt/06-compiler/)
- **デッドコード除去**(dead code elimination): 結果が使われない計算を
  削除する最適化。[6章](/rust-opt/06-compiler/)
- **共通部分式除去**(common subexpression elimination): 同じ計算の
  重複を1回にまとめる最適化。[6章](/rust-opt/06-compiler/)
- **ループ不変式移動**(loop-invariant code motion): ループ内で不変の
  計算をループ外へ出す最適化。[6章](/rust-opt/06-compiler/)
- **ループのアンローリング**(loop unrolling): ループ本体を複数回分
  展開する最適化。[6章](/rust-opt/06-compiler/)
- **インライン化**(inlining): 関数呼び出しを本体で置き換える最適化。
  他の最適化の起点になる。[6章](/rust-opt/06-compiler/)
- **opt-level**: 最適化の強さの設定。0(なし)〜3(最大)と
  サイズ優先のs/z。releaseビルドの既定は3。[6章](/rust-opt/06-compiler/)
- **codegen-units**: クレートを何分割して並列コンパイルするかの設定。
  1にすると最適化の対象範囲が広がる。[6章](/rust-opt/06-compiler/)
- **LTO**(link-time optimization): リンク時にクレート横断で行う最適化。[6章](/rust-opt/06-compiler/)
- **PGO**(profile-guided optimization): 実行統計をもとにした最適化。[6章](/rust-opt/06-compiler/)
- **エイリアス**(alias): 複数の参照が同じメモリを指すこと。Rustは
  型システムで「重ならない」ことをLLVMに保証できる。[6章](/rust-opt/06-compiler/)
- **ゼロコスト抽象化**(zero-cost abstraction): 使わない機能のコストは
  なく、使う機能は手書き同等、という性質。[7章](/rust-opt/07-zero-cost/)
- **境界チェック**(bounds check): 添字アクセスが範囲内かの実行時検査。
  単純なループではコンパイラが除去・ホイストする。[7章](/rust-opt/07-zero-cost/)
- **niche最適化**(niche optimization): 型の使われないビットパターンを
  enumのタグに流用する最適化。`Option<&T>`は参照と同サイズ。[7章](/rust-opt/07-zero-cost/)
- **単相化**(monomorphization): ジェネリクスを使われる型ごとの専用
  コードに展開すること。[7章](/rust-opt/07-zero-cost/)
- **vtable**(仮想関数表): トレイトオブジェクトが参照するメソッドの
  関数ポインタ表。[7章](/rust-opt/07-zero-cost/)
- **動的ディスパッチ**(dynamic dispatch): 実行時にvtableを引いて
  メソッドを呼ぶ方式。[7章](/rust-opt/07-zero-cost/)
- **脱仮想化**(devirtualization): コンパイラが動的ディスパッチを
  静的呼び出しに置き換える最適化。[7章](/rust-opt/07-zero-cost/)

## 計測

- **ベンチマーク**(benchmark): 処理単体の実行時間を統計的に測ること。
  Rustではcriterionが定番。[8章](/rust-opt/08-measure/)
- **プロファイラ**(profiler): プログラム全体のどこで時間が使われて
  いるかを標本化で調べるツール。[8章](/rust-opt/08-measure/)
- **フレームグラフ**(flame graph): プロファイル結果の可視化。横幅が
  時間、縦が呼び出し関係。[8章](/rust-opt/08-measure/)
- **ハードウェアパフォーマンスカウンタ**(hardware performance counter):
  命令数・キャッシュミスなどを数えるCPU内蔵のカウンタ。[8章](/rust-opt/08-measure/)
- **black_box**: 計測対象がコンパイラに削除されるのを防ぐ関数
  (`std::hint::black_box`)。[7章](/rust-opt/07-zero-cost/)・[8章](/rust-opt/08-measure/)

## GPU

- **GPU**(graphics processing unit): 画面描画のために、多数の要素に
  同じ計算を並列に行う設計で作られた処理装置。[9章](/gpu/09-gpu-architecture/)
- **GPGPU**(general-purpose computing on GPU): GPUを描画以外の
  汎用計算に使うこと。[9章](/gpu/09-gpu-architecture/)
- **レイテンシ指向/スループット指向**(latency-/throughput-oriented):
  1つの処理の速さを追うCPU的設計/総処理量を追うGPU的設計。[9章](/gpu/09-gpu-architecture/)
- **SIMT**(single instruction, multiple threads): スレッドの組に同じ
  命令を実行させるGPUの実行モデル。[9章](/gpu/09-gpu-architecture/)
- **ワープ**(warp): 同じ命令をロックステップで実行する32本程度の
  スレッドの組。WebGPUではサブグループ。[9章](/gpu/09-gpu-architecture/)
- **ダイバージェンス**(divergence): ワープ内で分岐の行き先が分かれ、両側を順に
  実行する状態。[9章](/gpu/09-gpu-architecture/)
- **占有率**(occupancy): レイテンシを隠すのに十分なワープが実行単位に
  常駐できているかの指標。[9章](/gpu/09-gpu-architecture/)
- **ワークグループ**(workgroup): 共有メモリとバリアを使える
  スレッドのグループ。CUDAのthread blockに相当。[9章](/gpu/09-gpu-architecture/)
- **VRAM**: GPU専用の広帯域メモリ(GDDR/HBM)。[10章](/gpu/10-gpu-memory/)
- **メモリコアレッシング**(memory coalescing): ワープ内の隣接アドレスへの
  アクセスを少数の転送に束ねる仕組み。[10章](/gpu/10-gpu-memory/)
- **共有メモリ**(shared memory / workgroup memory): ワークグループ内で
  共有する、プログラマが明示的に管理する高速メモリ。[10章](/gpu/10-gpu-memory/)
- **バリア**(barrier): グループ内の全スレッドが到達するまで待つ同期点。[10章](/gpu/10-gpu-memory/)
- **ユニファイドメモリ**(unified memory): CPUとGPUが同じ物理メモリを
  共有する構成。Apple Siliconなど。[10章](/gpu/10-gpu-memory/)
- **算術強度**(arithmetic intensity): 演算数÷転送バイト数(FLOP/byte)。[10章](/gpu/10-gpu-memory/)
- **ルーフラインモデル**(roofline model): 算術強度から性能上限を
  見積もる図式。メモリ帯域律速と演算律速の2本の上限線を持つ。[10章](/gpu/10-gpu-memory/)
- **メモリ帯域律速/演算律速**(memory-/compute-bound): 性能の上限が
  帯域で/演算能力で決まっている状態。[10章](/gpu/10-gpu-memory/)
- **シェーダ**(shader): GPU上で実行されるプログラム。
  計算用のものはカーネル(kernel)とも呼ばれる。[9章](/gpu/09-gpu-architecture/)
- **FLOP**(floating-point operation): 浮動小数点演算1回。
  毎秒10億回がGFLOP/s、毎秒1兆回がTFLOP/s。[10章](/gpu/10-gpu-memory/)
- **WGSL**(WebGPU Shading Language): WebGPU標準のシェーダ言語。[11章](/gpu/11-wgpu/)
- **wgpu**: WebGPU標準のRust実装。Metal/Vulkan/DX12を抽象化する。[11章](/gpu/11-wgpu/)

## 数の表現(応用編)

- **2の補数**(two's complement): 符号つき整数の標準表現。最上位ビットの
  重みを負にする。符号の有無で加算器を分けずに済む。[13章](/cpu-deep/13-numbers/)
- **オーバーフロー**(overflow): 演算結果が型の表現範囲を超えること。
  Rustではdebugビルドで検査、releaseは既定で回り込み(設定で変更可)。[13章](/cpu-deep/13-numbers/)
- **IEEE 754**: 浮動小数点数の標準。±(1.仮数)×2^指数の2進表現。[13章](/cpu-deep/13-numbers/)
- **Kahanの総和**(Kahan summation): 加算で失われた丸め誤差を
  補正変数に保持し、次の加算で加え戻す総和アルゴリズム。[13章](/cpu-deep/13-numbers/)
- **NaN**(not a number): 不正な演算の結果を表す特殊値。
  自分自身とも等しくない。ソートには`total_cmp`。[13章](/cpu-deep/13-numbers/)
- **非正規化数**(subnormal): 最小の正規化数より小さい値を、精度を下げて
  表す仕組み。演算速度はハードウェア依存。[13章](/cpu-deep/13-numbers/)
- **bf16**(bfloat16): f32の上位16ビットを切り出した形式。指数幅が
  f32と同じため値の範囲が変わらない。現在の機械学習計算で主に使われる。[13章](/cpu-deep/13-numbers/)
- **量子化**(quantization): 重みなどをint8/int4等の狭い表現に
  変換して格納する技法。[25章](/gpu-deep/25-matrix-engines/)

## 仮想メモリとキャッシュ内部(応用編)

- **仮想メモリ**(virtual memory): プログラムが見る仮想アドレスを
  物理アドレスへ変換する仕組みの総称。隔離、連続したアドレス空間の見かけ、割り当ての遅延と共有を
  提供する。[14章](/cpu-deep/14-virtual-memory/)
- **仮想アドレス/物理アドレス**(virtual address / physical address):
  プログラムが使うアドレス/メモリ装置上の実際の位置。
  アクセスのたびにMMUが前者を後者へ変換する。[14章](/cpu-deep/14-virtual-memory/)
- **ページ**(page): アドレス変換の単位。4KBが主流(Apple Siliconは16KB)。[14章](/cpu-deep/14-virtual-memory/)
- **ページテーブル**(page table): 仮想→物理の変換表。多段の木構造。[14章](/cpu-deep/14-virtual-memory/)
- **MMU**(memory management unit): アドレス変換を行うCPU内の装置。[14章](/cpu-deep/14-virtual-memory/)
- **ページウォーク**(page walk): 多段ページテーブルをたどる処理。
  最悪でメモリアクセス4回ぶん。[14章](/cpu-deep/14-virtual-memory/)
- **TLB**(translation lookaside buffer): アドレス変換結果のキャッシュ。
  対応できるアドレス範囲は4KBページで10MB程度と狭い。[14章](/cpu-deep/14-virtual-memory/)
- **hugepages**: 2MB/1GBの大きなページ。TLBが対応できるアドレス範囲を広げる。
  Linuxの自動版がTHP。[14章](/cpu-deep/14-virtual-memory/)
- **THP**(transparent huge pages): Linuxカーネルが条件を満たす領域を
  自動的に大きなページにまとめる仕組み。[14章](/cpu-deep/14-virtual-memory/)
- **デマンドページング**(demand paging): 物理メモリの割り当てを
  初回アクセスまで遅らせる方式。[14章](/cpu-deep/14-virtual-memory/)
- **ページフォールト**(page fault): 実体のないページへのアクセスで
  発生する例外。OSが物理フレームを割り当てて再実行する。[14章](/cpu-deep/14-virtual-memory/)
- **コピーオンライト**(copy-on-write、COW): 共有しておき、書き込みの
  瞬間に複製する技法。[14章](/cpu-deep/14-virtual-memory/)
- **mmap**(memory map): ファイルを仮想アドレス空間に対応づける
  システムコール。[14章](/cpu-deep/14-virtual-memory/)・[27章](/systems/27-os-layer/)
- **セットアソシアティブ**(set-associative): キャッシュの配置方式。
  アドレスで決まるセットの中の任意のウェイに置く。[15章](/cpu-deep/15-cache-internals/)
- **セット/ウェイ/タグ**(set/way/tag): キャッシュの区画・区画内の枠・
  照合用のアドレス上位ビット。[15章](/cpu-deep/15-cache-internals/)
- **初回ミス/容量性ミス**(cold miss / capacity miss): 一度も読んでいない
  データへの最初のアクセスで起きるミス/作業データがキャッシュ容量を
  超えているために起きるミス。[15章](/cpu-deep/15-cache-internals/)
- **競合性ミス**(conflict miss): 容量は余っているのに特定セットへの
  集中で起きるミス。初回(cold)・容量性(capacity)と並ぶ3分類の1つ。[15章](/cpu-deep/15-cache-internals/)
- **キャッシュブロッキング**(cache blocking): 走査をキャッシュに収まる
  ブロック単位に分ける技法。タイリングとも。[15章](/cpu-deep/15-cache-internals/)
- **cache-oblivious**: キャッシュ容量を知らずに再帰分割で全階層に
  適応するアルゴリズム設計。[15章](/cpu-deep/15-cache-internals/)

## CPU実行の深層(応用編)

- **フロントエンド/バックエンド**(front end / back end): 命令の供給側と
  実行側。どちらか遅い方が律速する。[16章](/cpu-deep/16-frontend/)
- **μop**(micro-operation): CPU内部の固定形式命令。x86の可変長命令は
  デコードでμopに分解される。[16章](/cpu-deep/16-frontend/)
- **BTB**(branch target buffer): 分岐の行き先アドレスを記録する表。
  間接分岐の予測に使う。[16章](/cpu-deep/16-frontend/)
- **間接分岐**(indirect branch): 飛び先がレジスタ値で決まる分岐。
  関数ポインタ、vtable、matchのジャンプテーブル。[16章](/cpu-deep/16-frontend/)
- **top-down分析**(top-down analysis): 発行スロットをRetiring/
  Bad Speculation/Frontend Bound/Backend Boundの4分類で切り分ける
  性能診断法。[16章](/cpu-deep/16-frontend/)
- **ストアバッファ**(store buffer): 書き込みを一時的に保持するコア内の
  待ち行列。ストア→ロードの並べ替えの原因。[17章](/cpu-deep/17-memory-model/)
- **メモリモデル**(memory model): CPUが許すメモリ操作の並べ替えの範囲。
  x86はTSO(強い)、ARMはweak(弱い)。[17章](/cpu-deep/17-memory-model/)
- **TSO**(total store order): x86のメモリモデル。ストアバッファに
  由来するストア→ロードの並べ替え以外を許さない。[17章](/cpu-deep/17-memory-model/)
- **CAS**(compare-and-swap): 「期待値と一致したら書き換える」を1つの
  アトミック操作で行う命令。ロックフリーの基礎。[17章](/cpu-deep/17-memory-model/)
- **LL/SC**(load-linked/store-conditional): 読み出しから書き込みまでの間に
  他のコアが同じ場所に書き込んでいたら書き込みを失敗させる、
  ARMなどのアトミック操作の実装方式。[17章](/cpu-deep/17-memory-model/)
- **ABA問題**: 値がA→B→Aと戻ったためCASが変更を検出できない問題。[17章](/cpu-deep/17-memory-model/)
- **エポックベース回収**(epoch-based reclamation): ロックフリー構造の
  メモリを世代管理で安全に解放する方式。crossbeamが実装。[17章](/cpu-deep/17-memory-model/)

## Rustの深層(応用編)

- **アロケータ**(allocator): OSから取得したメモリを小さな単位に分けて割り当てるヒープの
  管理機構。サイズクラス+スレッドキャッシュが現代の定石。[18章](/rust-deep/18-allocators/)
- **サイズクラス/フリーリスト**(size class / free list): 規格サイズごとの
  空き領域の管理。確保・解放の速い経路を実現する。[18章](/rust-deep/18-allocators/)
- **断片化**(fragmentation): 切り上げによる未使用領域(内部)と、使用中領域の間に散在する空き(外部)。[18章](/rust-deep/18-allocators/)
- **アリーナ確保**(arena allocation): 同じ寿命のものを1つの連続領域に置き、
  まとめて解放する方式。確保はポインタを進めるだけ(バンプ
  アロケーション)。[18章](/rust-deep/18-allocators/)
- **状態機械**(state machine): 有限個の状態と遷移で処理を表す構造。
  コンパイラはasync関数を`.await`の位置で分割した状態機械に変換する。[19章](/rust-deep/19-async/)
- **Future**: asyncの処理を表す状態機械。`.await`の位置で状態が分割される。
  中断中の変数はFutureの中に保存される。[19章](/rust-deep/19-async/)
- **poll/Waker**: ランタイムがFutureを駆動する規約。pollは進行を要求し、
  Wakerは再開可能になったことの通知に使う。[19章](/rust-deep/19-async/)
- **ランタイム**(async runtime): Futureをpollして実行する機構。Rust本体は
  含まず、tokioなどのライブラリが提供する。[19章](/rust-deep/19-async/)
- **spawn_blocking**: ブロッキング処理を専用スレッドプールへ隔離する
  tokioのAPI。[19章](/rust-deep/19-async/)
- **未定義動作**(undefined behavior、UB): コンパイラの最適化前提を破る
  操作。挙動の一切が保証されなくなる。クラッシュするとは限らない。[20章](/rust-deep/20-unsafe-ub/)
- **Miri**: MIRを解釈実行してUBを検出するツール。[20章](/rust-deep/20-unsafe-ub/)
- **FFI**(foreign function interface): C ABIを介した他言語との相互運用。
  呼び出し自体は安価で、コストは最適化境界と表現変換にある。[20章](/rust-deep/20-unsafe-ub/)
- **BOLT**: リンク済みバイナリを実行プロファイルで並べ替える最適化ツール。[21章](/rust-deep/21-build-control/)
- **SwissTable**: Rustの`HashMap`の実装方式。制御バイト配列を
  SIMDで探査する。[22章](/rust-deep/22-data-structures/)
- **HashDoS**: 衝突するキーを大量に送ってハッシュ表をO(n)に退化させる
  攻撃。既定のSipHashはこれへの耐性を持つ。[22章](/rust-deep/22-data-structures/)
- **インターニング**(interning): 同じ値を1か所に登録し整数IDで参照する
  技法。比較が整数比較になる。[22章](/rust-deep/22-data-structures/)
- **ビットセット**(bitset): 整数集合を1要素1ビットで表す構造。
  所属判定はシフトとANDだけ。[22章](/rust-deep/22-data-structures/)

## GPUの深層(応用編)

- **reduction**(リダクション): 配列全体を1つの値に集約する計算の総称。
  総和・最大値など。[23章](/gpu-deep/23-kernel-optimization/)
- **グリッドストライドループ**(grid-stride loop): スレッドが添字を総スレッド数
  ずつ進めながら全体を処理するループ。コアレッシングを保つ。[23章](/gpu-deep/23-kernel-optimization/)
- **スレッド粗粒度化**(thread coarsening): 1スレッドの担当を増やして
  同期と起動のコストを相対的に減らす技法。[23章](/gpu-deep/23-kernel-optimization/)
- **subgroup命令**: ワープ内の集約・交換をバリアなしで行う命令群。
  CUDAのwarp shuffleに相当。[23章](/gpu-deep/23-kernel-optimization/)
- **ダブルバッファリング**(double buffering): 2組のバッファを交互に使い、
  転送と処理を重ねる古典技法。[24章](/gpu-deep/24-overlap/)
- **行列エンジン**(matrix engine): 行列タイル同士の乗算累積を専用回路で
  行うユニット。テンソルコア、Apple AMX、Intel AMXなど。[25章](/gpu-deep/25-matrix-engines/)
- **テンソルコア**(Tensor Core): NVIDIA GPUの行列エンジン。ワープ単位で
  小さな行列(例: 16×16)の乗算累積を実行する。[25章](/gpu-deep/25-matrix-engines/)
- **BLAS**(basic linear algebra subprograms): 線形代数ライブラリの
  標準インターフェース。Accelerate/OpenBLAS/cuBLAS等が実装。[25章](/gpu-deep/25-matrix-engines/)
- **タイムスタンプクエリ**(timestamp query): GPU自身の時計をコマンド列の
  特定位置で記録する計測機構。[26章](/gpu-deep/26-gpu-timing/)

## システムと実践(応用編)

- **システムコール**(system call): カーネルの機能を特権モードで実行するための要求。
  本書のPlayground実測では通常の関数呼び出しの100倍超のコスト。[27章](/systems/27-os-layer/)
- **コンテキストスイッチ**(context switch): スレッド/プロセスの切り替え。
  スレッド間で相互に待機解除する1往復は実測で十数マイクロ秒で、加えてキャッシュ内容が失われる。[27章](/systems/27-os-layer/)
- **ページキャッシュ**(page cache): OSがファイル内容をメモリに保持する
  キャッシュ。2回目以降の読みはメモリ速度。[27章](/systems/27-os-layer/)
- **vDSO**: カーネルが一部の機能(時刻取得など)をユーザー空間に
  公開してシステムコールを省く仕組み。[27章](/systems/27-os-layer/)
- **io_uring**: 提出/完了のリングバッファを共有してシステムコールを
  減らすLinuxのI/O機構。[27章](/systems/27-os-layer/)
- **パーセンタイル**(percentile): 分布の位置を示す統計量。p99は
  「100回に1回の遅さ」。レイテンシは平均でなく分布で評価する。[28章](/systems/28-performance-engineering/)
- **協調的省略**(coordinated omission): 応答を待ってから次を送る計測が、
  遅い期間のサンプルを記録せずp99を過小評価する計測上の誤り。[28章](/systems/28-performance-engineering/)
- **ノイジーネイバー**(noisy neighbor): 同じ物理ホスト上の他のテナントと
  キャッシュやメモリ帯域を共有するため、同じコードの性能が
  時期によって変わる現象。[28章](/systems/28-performance-engineering/)
