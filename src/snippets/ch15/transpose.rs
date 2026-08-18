use std::time::Instant;

fn main() {
    let n = 2048;
    let src: Vec<f32> = (0..n * n).map(|i| i as f32).collect();
    let mut dst = vec![0.0f32; n * n];

    // (1) 素朴な転置: dst の書き込みが列方向(ストライドn)になる
    let start = Instant::now();
    for i in 0..n {
        for j in 0..n {
            dst[j * n + i] = src[i * n + j];
        }
    }
    println!("素朴な転置        : {:>9.3?} (check={})", start.elapsed(), dst[123 * n + 45]);

    // (2) 32×32のブロック単位で転置: 読み書きともキャッシュ内で完結
    let mut dst2 = vec![0.0f32; n * n];
    let b = 32;
    let start = Instant::now();
    for bi in (0..n).step_by(b) {
        for bj in (0..n).step_by(b) {
            for i in bi..bi + b {
                for j in bj..bj + b {
                    dst2[j * n + i] = src[i * n + j];
                }
            }
        }
    }
    println!("ブロック転置(32×32): {:>9.3?} (check={})", start.elapsed(), dst2[123 * n + 45]);
    assert!(dst == dst2);
}
