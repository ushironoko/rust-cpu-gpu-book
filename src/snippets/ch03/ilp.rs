use std::time::Instant;

fn main() {
    // 100万要素 = 8MB。キャッシュにほぼ収まる大きさにして、メモリ待ちの影響を除く
    let n = 1_000_000;
    let data: Vec<f64> = (0..n).map(|i| (i % 100) as f64 * 0.01).collect();
    let passes = 20;

    // 1本のアキュムレータ: 前の加算が終わるまで次の加算を始められない
    let start = Instant::now();
    let mut sum = 0.0f64;
    for _ in 0..passes {
        for &v in data.iter() {
            sum += v;
        }
    }
    println!("アキュムレータ1本: {:>9.3?} (sum={sum:.0})", start.elapsed());

    // 4本のアキュムレータ: 依存しない4つの加算の連鎖が並行して進む
    let start = Instant::now();
    let mut sum = 0.0f64;
    for _ in 0..passes {
        let mut s = [0.0f64; 4];
        let mut chunks = data.chunks_exact(4);
        for c in &mut chunks {
            s[0] += c[0];
            s[1] += c[1];
            s[2] += c[2];
            s[3] += c[3];
        }
        sum += s.iter().sum::<f64>() + chunks.remainder().iter().sum::<f64>();
    }
    println!("アキュムレータ4本: {:>9.3?} (sum={sum:.0})", start.elapsed());
}
