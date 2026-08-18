// 行列積 C = A × B (n×n、行優先格納)

@group(0) @binding(0)
var<storage, read> a: array<f32>;

@group(0) @binding(1)
var<storage, read> b: array<f32>;

@group(0) @binding(2)
var<storage, read_write> c: array<f32>;

struct Params {
    n: u32,
    _pad0: u32,
    _pad1: u32,
    _pad2: u32,
}

@group(0) @binding(3)
var<uniform> params: Params;

// ---- 素朴版: スレッド1つが C の1要素を計算する ----
@compute @workgroup_size(16, 16)
fn matmul_naive(@builtin(global_invocation_id) gid: vec3<u32>) {
    let n = params.n;
    let row = gid.y;
    let col = gid.x;
    if (row >= n || col >= n) {
        return;
    }
    var sum = 0.0;
    for (var k = 0u; k < n; k = k + 1u) {
        sum = sum + a[row * n + k] * b[k * n + col];
    }
    c[row * n + col] = sum;
}

// ---- ブロック版: スレッド1つが C の4×4ブロックを計算する ----
// 1スレッドあたりの読み出し(5個)に対する積和(16回)の比率を上げる
@compute @workgroup_size(8, 8)
fn matmul_blocked(@builtin(global_invocation_id) gid: vec3<u32>) {
    let n = params.n; // n は32の倍数を前提とする
    let row0 = gid.y * 4u;
    let col0 = gid.x * 4u;
    // 4×4個の積算値をレジスタに保持する(varは0で初期化される)
    var acc: array<vec4<f32>, 4>;
    for (var k = 0u; k < n; k = k + 1u) {
        // B の行から4要素(連続)をまとめて読む
        let base = k * n + col0;
        let vb = vec4<f32>(b[base], b[base + 1u], b[base + 2u], b[base + 3u]);
        for (var i = 0u; i < 4u; i = i + 1u) {
            let aik = a[(row0 + i) * n + k];
            acc[i] = acc[i] + aik * vb;
        }
    }
    for (var i = 0u; i < 4u; i = i + 1u) {
        let base = (row0 + i) * n + col0;
        c[base] = acc[i].x;
        c[base + 1u] = acc[i].y;
        c[base + 2u] = acc[i].z;
        c[base + 3u] = acc[i].w;
    }
}

// ---- タイル版: ワークグループ(16×16)で共有メモリにタイルを載せて使い回す ----
const TILE: u32 = 16u;

var<workgroup> tile_a: array<f32, 256>;
var<workgroup> tile_b: array<f32, 256>;

@compute @workgroup_size(16, 16)
fn matmul_tiled(
    @builtin(global_invocation_id) gid: vec3<u32>,
    @builtin(local_invocation_id) lid: vec3<u32>,
) {
    let n = params.n; // n は16の倍数を前提とする
    let row = gid.y;
    let col = gid.x;
    var sum = 0.0;
    let tiles = n / TILE;
    for (var t = 0u; t < tiles; t = t + 1u) {
        // 各スレッドがタイルの1要素ずつを共有メモリへ運ぶ
        tile_a[lid.y * TILE + lid.x] = a[row * n + (t * TILE + lid.x)];
        tile_b[lid.y * TILE + lid.x] = b[(t * TILE + lid.y) * n + col];
        // ワークグループ内の全スレッドが運び終わるまで待つ
        workgroupBarrier();
        // タイル内の16要素分の積和は、すべて共有メモリから読む
        for (var k = 0u; k < TILE; k = k + 1u) {
            sum = sum + tile_a[lid.y * TILE + k] * tile_b[k * TILE + lid.x];
        }
        workgroupBarrier();
    }
    c[row * n + col] = sum;
}
