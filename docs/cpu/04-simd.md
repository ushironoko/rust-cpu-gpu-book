---
title: SIMDとベクトル化
description: 1命令で複数のデータを計算するSIMD。自動ベクトル化が適用される条件と適用されない理由、portable_simdによる明示的ベクトル化まで。
sidebar:
  label: 4. SIMDとベクトル化
---

この章でわかること:

- SIMD: 1つの命令で複数のデータを同時に計算する仕組み
- コンパイラによる自動ベクトル化と、それが適用される条件
- 整数の合計は速いのに、浮動小数点の合計が12倍遅い理由
- `portable_simd`による明示的なSIMDの書き方
- CPUのより新しいSIMD命令をコンパイラに許可する方法

## SIMD: 1命令で複数のデータを計算する

前章までのCPUは、1つの加算命令で1組の数を足していました。
しかし「配列の全要素に同じ計算をする」処理では、
同じ命令を延々と繰り返すことになります。
それなら、**1つの命令で複数の要素をまとめて計算**できるほうが効率的です。

この方式を**SIMD**(single instruction, multiple data)と呼びます。
SIMD命令は、通常より幅の広い**ベクトルレジスタ**(vector register)を使います。
例えば128ビットのベクトルレジスタには、32ビット整数(`i32`)が4個入ります。
この「まとめて扱う1区画」を**レーン**(lane)と呼びます。
次の図は、スカラ(1個ずつ計算する方式)との違いを示します。

<figure class="book-figure"><svg viewBox="0 0 640 210" role="img" aria-label="スカラ加算とSIMD加算の比較図"><style>
      .vcell { fill: var(--sl-color-accent-low); stroke: var(--sl-color-accent); }
      .scell { fill: none; stroke: var(--sl-color-gray-4); }
      .t { fill: var(--sl-color-white); font-size: 12px; text-anchor: middle; }
      .cap { fill: var(--sl-color-gray-3); font-size: 12px; }
      .op { fill: var(--sl-color-gray-3); font-size: 15px; text-anchor: middle; }
    </style><text x="8" y="24" class="cap">スカラ: 加算命令を4回実行</text><g><rect x="20" y="34" width="40" height="26" class="scell"></rect><text x="40" y="51" class="t">a0</text><text x="70" y="52" class="op">+</text><rect x="80" y="34" width="40" height="26" class="scell"></rect><text x="100" y="51" class="t">b0</text></g><g><rect x="170" y="34" width="40" height="26" class="scell"></rect><text x="190" y="51" class="t">a1</text><text x="220" y="52" class="op">+</text><rect x="230" y="34" width="40" height="26" class="scell"></rect><text x="250" y="51" class="t">b1</text></g><g><rect x="320" y="34" width="40" height="26" class="scell"></rect><text x="340" y="51" class="t">a2</text><text x="370" y="52" class="op">+</text><rect x="380" y="34" width="40" height="26" class="scell"></rect><text x="400" y="51" class="t">b2</text></g><g><rect x="470" y="34" width="40" height="26" class="scell"></rect><text x="490" y="51" class="t">a3</text><text x="520" y="52" class="op">+</text><rect x="530" y="34" width="40" height="26" class="scell"></rect><text x="550" y="51" class="t">b3</text></g><text x="8" y="110" class="cap">SIMD: ベクトル加算命令を1回実行(4レーン同時)</text><rect x="20" y="120" width="60" height="26" class="vcell"></rect><rect x="82" y="120" width="60" height="26" class="vcell"></rect><rect x="144" y="120" width="60" height="26" class="vcell"></rect><rect x="206" y="120" width="60" height="26" class="vcell"></rect><text x="50" y="137" class="t">a0</text><text x="112" y="137" class="t">a1</text><text x="174" y="137" class="t">a2</text><text x="236" y="137" class="t">a3</text><text x="282" y="138" class="op">+</text><rect x="300" y="120" width="60" height="26" class="vcell"></rect><rect x="362" y="120" width="60" height="26" class="vcell"></rect><rect x="424" y="120" width="60" height="26" class="vcell"></rect><rect x="486" y="120" width="60" height="26" class="vcell"></rect><text x="330" y="137" class="t">b0</text><text x="392" y="137" class="t">b1</text><text x="454" y="137" class="t">b2</text><text x="516" y="137" class="t">b3</text><text x="8" y="188" class="cap">1つのベクトルレジスタ(128ビット)に i32 が4レーン入る</text></svg><figcaption>同じ4組の加算でも、SIMDなら1命令で済む</figcaption></figure>

SIMD命令はCPUの世代とともに拡張されてきました。
おおまかには次の系統を知っていれば十分です。

- x86-64には、**SSE2**(128ビット、全x86-64 CPUが対応)、
  **AVX/AVX2**(256ビット)、**AVX-512**(512ビット、対応CPU限定)があります
- ARM64には、**NEON**(128ビット、全ARM64 CPUが対応)と
  SVE(可変長、対応CPU限定)があります

コンパイラは既定では「そのアーキテクチャの全CPUが持つ命令」しか
使いません。x86-64ならSSE2、ARM64ならNEONが基準です。

## 自動ベクトル化: コンパイラによるSIMD命令の生成

SIMDを使うのに、特別なコードを書く必要はないことも多いです。
コンパイラ(正確にはLLVM。[6章](/rust-opt/06-compiler/)参照)は、
ループを解析してSIMD命令に変換する**自動ベクトル化**
(auto-vectorization)を行います。

1章と同じ方法で、`i32`のスライスを合計する関数のアセンブリを見てみます。

```rust
pub fn sum(v: &[i32]) -> i32 {
    let mut s = 0i32;
    for &x in v {
        s = s.wrapping_add(x);
    }
    s
}
```

releaseビルドでは、ループの中心部は次のアセンブリになります(x86-64、抜粋)。

```asm
.LBB0_5:
	movdqu	xmm2, xmmword ptr [rdi + 4*rax]
	paddd	xmm1, xmm2
	movdqu	xmm2, xmmword ptr [rdi + 4*rax + 16]
	paddd	xmm0, xmm2
	add	rax, 8
	cmp	r8, rax
	jne	.LBB0_5
```

`xmm0`〜`xmm2`が128ビットのベクトルレジスタ、`paddd`が
「i32を4レーン同時に加算」する命令です。しかも`xmm0`と`xmm1`の
**2本のアキュムレータ**に分けて足しています。前章で手作業で行った
「依存の連鎖を分ける」変形を、コンパイラは自動で行い、
1周あたり8要素を処理しているのです。

自動ベクトル化が適用されやすいのは、おおよそ次の条件を満たすループです。

- 連続したメモリを順に読み書きするループです(スライス、`Vec`の走査)。
  非連続アクセスを扱えるSIMD命令もありますが、連続が最も効率的です
- 反復間に依存がないループです(前の周の結果を次の周が使わない)。
  合計のような集約は形の上では依存がありますが、順序を変えても
  結果が変わらない整数では、並べ替え可能な特例として扱われます
- 分岐がないか、前章のif変換で消せる形をしているループです

2章のSoAが有利な理由もここにあります。必要なデータが連続して
並んでいることは、キャッシュだけでなくSIMDの前提条件でもあります。

## 実験: 整数は速いのに浮動小数点が遅い

同じ書き方の合計ループを、`i32`と`f32`で実行して比べます。

<RustPlay snippet="ch04/auto" mode="release" title="同じ書き方の合計。i32とf32で何が違うか" />

筆者の実測(Playground)では`i32`が約1.5ミリ秒、`f32`が約18.6ミリ秒で、
**12倍の差**がつきました。`i32`は上で見たとおりSIMD化され、
`f32`は1個ずつ順に足すコードのままだからです。

なぜコンパイラは`f32`をベクトル化しないのでしょうか。

浮動小数点数の加算は、数学の実数と違って**結合則が成り立ちません**。
有限の桁で丸めながら計算するため、`(a + b) + c`と`a + (b + c)`の結果は
わずかに異なることがあります。SIMD化(や複数アキュムレータ化)は
足す順序を変える変形なので、**結果のビットが変わりうる**のです。
Rustコンパイラは書かれたとおりの結果を保つことを優先し、
順序を変える最適化を行いません。

実験の出力をよく見ると、`i32`版と`f32`版で合計値そのものが
違っています(983,644,560 対 990,000,000)。これは`f32`の逐次加算で
丸め誤差が蓄積した結果で、「順序が結果を変える」ことの実例です。

:::note[fast-mathについて]
C/C++コンパイラには、この制約を外して浮動小数点の並べ替えを
許可する`-ffast-math`という指定があります。Rustの安定版には
相当する全体スイッチはなく、演算単位の`fadd_fast`などが
nightlyに存在するのみです(2026年時点)。「精度と引き換えの高速化は、
プログラマが明示的に選ぶべき」というのがRustの設計方針です。
:::

## 明示的SIMD: portable_simd

`f32`の合計を速くするには、「順序を変えてよい」という判断を
プログラマが引き受けて、明示的にSIMDで書きます。

nightlyのRustには**portable SIMD**(`std::simd`)という、
CPUの種類によらず書けるSIMD APIがあります。`f32x8`は
「f32を8レーン持つベクトル」型です。次のコードはnightlyの
Playgroundで実行されます。

<RustPlay snippet="ch04/nightly-simd" mode="release" channel="nightly" title="f32の合計を8レーンで(nightly)" />

筆者の実測(Playground)ではスカラ約18.5ミリ秒に対してSIMD版は約2.4ミリ秒、
**約8倍**です。さらに出力を見ると、SIMD版の合計は990,000,000と
正確な値になっています。8本の部分和それぞれが小さく保たれるため、
丸め誤差もむしろ減ったのです。足す順序の設計をプログラマが引き受けた、
と理解するのが正確であり、速さのために精度を下げたわけではありません。

コードについて2点補足します。第一に、`splat`は全レーンを同じ値で
埋める関数、`from_slice`はスライスの先頭8要素をレーンに読み込む関数、
`reduce_sum`は8レーンを1つの合計にまとめる関数です。
第二に、`f32x8`の「8レーン」は論理的な幅です。実際に何ビットの
命令になるかはコンパイル対象のCPUに合わせて決まり、
既定のx86-64(SSE2)では128ビット命令2つに分割されます。

## 安定版での明示的SIMD: std::arch

`std::simd`はまだnightly限定です(2026年時点)。安定版で明示的に
SIMDを書く場合は、`std::arch`にあるCPU命令直結の関数
(**イントリンシック**、intrinsic)を使います。

```rust
#[cfg(target_arch = "x86_64")]
fn sum_f32(v: &[f32]) -> f32 {
    if is_x86_feature_detected!("avx2") {
        // AVX2対応CPUでだけ、AVX2版(unsafe)を呼ぶ
        unsafe { sum_f32_avx2(v) }
    } else {
        v.iter().sum()
    }
}
```

イントリンシックは対象CPUを直接指定するため移植性がなく、
`unsafe`も必要です。`unsafe`になる理由は「対応していないCPUで
実行すると未定義動作になる」ためです。したがって、AVX2版の関数に
`#[target_feature(enable = "avx2")]`を付けたうえで、実行時にCPUの
対応を調べる`is_x86_feature_detected!`(**実行時機能検出**)で
保護して呼ぶのが定型です。
本書ではこれ以上詳しく扱いませんが、「安定版で利用できる最も低水準の
手段として存在する」ことを知っていれば十分です。実務では、
`wide`のようなクレートを使うか、自動ベクトル化が適用される形に
ループを整えるのが現実的な選択です。

## より新しいSIMD命令の使用をコンパイラに許可する

自動ベクトル化の性能は、コンパイラに「どの命令まで使ってよいか」を
伝えるだけでも変わります。既定のx86-64では128ビットのSSE2までですが、
次の指定でAVX2(256ビット)などを許可できます。

```sh
# 実行するマシン自身が持つ全命令を許可(そのマシン専用バイナリになる)
RUSTFLAGS="-C target-cpu=native" cargo build --release

# 特定の拡張だけを許可
RUSTFLAGS="-C target-feature=+avx2" cargo build --release
```

注意が必要なのは配布時です。AVX2を許可してコンパイルしたコードを
AVX2のないCPUで実行してはいけません。不正命令例外で停止する場合も
あれば、未定義動作になる場合もあります。手元で動かす計算プログラムなら
`target-cpu=native`が手軽ですが、配布物では既定のまま、もしくは
実行時機能検出で切り替える設計にします。

## まとめ

- SIMDは1命令で複数レーンを計算します。x86-64はSSE2(128ビット)が基準で、
  AVX2以降は明示的な許可が必要です
- コンパイラは「連続・依存なし・分岐なし」のループを自動ベクトル化します。
  データを連続に置くこと(2章)は、SIMDの前提条件でもあります
- 浮動小数点の加算は結合則が成り立たないため、順序を変える
  ベクトル化はコンパイラが行いません。実測では12倍の差になりました
- `portable_simd`(nightly)なら明示的なSIMDを移植性のある形で書けます。
  部分和が小さく保たれ、精度が改善する場合もあります

ここまでの高速化はすべて1つのコアの中の話でした。
現代のCPUにはコアが数個〜数十個あります。
次章では、複数のコアを使う並列処理と、
コア間でメモリを共有するときに生じる問題を扱います。
