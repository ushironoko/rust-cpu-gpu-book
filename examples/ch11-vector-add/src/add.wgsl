// ベクトル加算: c[i] = a[i] + b[i]
// WGSL (WebGPU Shading Language) で書かれたコンピュートシェーダ

// バインドグループ0の各バインディングにバッファを対応させる
@group(0) @binding(0)
var<storage, read> a: array<f32>;

@group(0) @binding(1)
var<storage, read> b: array<f32>;

@group(0) @binding(2)
var<storage, read_write> c: array<f32>;

// ワークグループ1つあたり64スレッド。
// この関数が「要素1つにつき1回」並列に呼ばれる
@compute @workgroup_size(64)
fn add(@builtin(global_invocation_id) gid: vec3<u32>) {
    let i = gid.x;
    // 要素数が64の倍数でない場合、はみ出したスレッドは何もしない
    if (i >= arrayLength(&a)) {
        return;
    }
    c[i] = a[i] + b[i];
}
