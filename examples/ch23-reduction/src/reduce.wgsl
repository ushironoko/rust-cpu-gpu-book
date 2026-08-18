// 総和(reduction)の3段階の実装。
// 入力: u32の配列。出力: 全要素の合計(atomic<u32>)

@group(0) @binding(0)
var<storage, read> input: array<u32>;

@group(0) @binding(1)
var<storage, read_write> result: atomic<u32>;

// ---- v1: 全スレッドがグローバルのatomicに足す ----
// 1677万スレッドが1つの変数を取り合う(5章のfalse sharingの極端版)
@compute @workgroup_size(256)
fn reduce_atomic(
    @builtin(workgroup_id) wgid: vec3<u32>,
    @builtin(local_invocation_id) lid: vec3<u32>,
) {
    let group = wgid.y * 256u + wgid.x; // 2次元ディスパッチを1次元に戻す
    let i = group * 256u + lid.x;
    if (i < arrayLength(&input)) {
        atomicAdd(&result, input[i]);
    }
}

// ---- v2: ワークグループ内で共有メモリの木で畳み、代表1つがatomicに足す ----
var<workgroup> partial: array<u32, 256>;

@compute @workgroup_size(256)
fn reduce_shared(
    @builtin(workgroup_id) wgid: vec3<u32>,
    @builtin(local_invocation_id) lid: vec3<u32>,
) {
    let group = wgid.y * 256u + wgid.x;
    let i = group * 256u + lid.x;
    var v = 0u;
    if (i < arrayLength(&input)) {
        v = input[i];
    }
    partial[lid.x] = v;
    workgroupBarrier();
    // 256 -> 128 -> 64 -> ... -> 1 と半分ずつ畳む
    var stride = 128u;
    while (stride > 0u) {
        if (lid.x < stride) {
            partial[lid.x] += partial[lid.x + stride];
        }
        workgroupBarrier();
        stride = stride / 2u;
    }
    if (lid.x == 0u) {
        atomicAdd(&result, partial[0]);
    }
}

// ---- v3: まず各スレッドがレジスタ上で64要素を足し、それから木で畳む ----
@compute @workgroup_size(256)
fn reduce_multi(
    @builtin(workgroup_id) wgid: vec3<u32>,
    @builtin(local_invocation_id) lid: vec3<u32>,
) {
    let n = arrayLength(&input);
    let threads = 1024u * 256u; // 総スレッド数
    var sum = 0u;
    // グリッドストライドループ: スレッドが跳びながら全体を覆う
    var i = wgid.x * 256u + lid.x;
    while (i < n) {
        sum += input[i];
        i += threads;
    }
    partial[lid.x] = sum;
    workgroupBarrier();
    var stride = 128u;
    while (stride > 0u) {
        if (lid.x < stride) {
            partial[lid.x] += partial[lid.x + stride];
        }
        workgroupBarrier();
        stride = stride / 2u;
    }
    if (lid.x == 0u) {
        atomicAdd(&result, partial[0]);
    }
}

