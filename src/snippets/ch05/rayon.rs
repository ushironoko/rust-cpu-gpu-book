use rayon::prelude::*;
use std::time::Instant;

// コラッツ数列: n が 1 になるまでの手数を数える(1要素あたりの仕事が重い例)
fn collatz_steps(mut n: u64) -> u64 {
    let mut steps = 0;
    while n != 1 {
        n = if n % 2 == 0 { n / 2 } else { 3 * n + 1 };
        steps += 1;
    }
    steps
}

fn main() {
    let range = 1u64..2_000_000;

    // rayonのスレッドプールは初回利用時に作られるため、
    // 計測前に一度動かして準備しておく(ウォームアップ)
    rayon::join(|| (), || ());

    let start = Instant::now();
    let total: u64 = range.clone().map(collatz_steps).sum();
    println!("逐次: {:>9.3?} (total={total})", start.elapsed());

    // 変更点は into_par_iter() だけ
    let start = Instant::now();
    let total: u64 = range.into_par_iter().map(collatz_steps).sum();
    println!("並列: {:>9.3?} (total={total})", start.elapsed());
}
