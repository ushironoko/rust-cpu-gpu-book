// 各要素に「それなりに重い」計算を適用する(ハッシュの反復)

@group(0) @binding(0)
var<storage, read> input: array<u32>;

@group(0) @binding(1)
var<storage, read_write> output: array<u32>;

@compute @workgroup_size(256)
fn work(@builtin(global_invocation_id) gid: vec3<u32>) {
    let i = gid.x;
    if (i >= arrayLength(&input)) {
        return;
    }
    var x = input[i];
    // 適度な計算負荷(転送だけの比較にならないように)
    for (var k = 0u; k < 64u; k = k + 1u) {
        x = x ^ (x << 13u);
        x = x ^ (x >> 17u);
        x = x ^ (x << 5u);
    }
    output[i] = x;
}
