use std::time::Instant;

fn main() {
    let n: u64 = 100_000_000; // 1億回
    let start = Instant::now();

    let mut sum: u64 = 0;
    for i in 0..n {
        sum = sum.wrapping_add(i);
    }

    let elapsed = start.elapsed();
    println!("合計: {sum}");
    println!("経過時間: {elapsed:?}");
    println!(
        "1秒あたり約 {:.1} 億回の加算",
        n as f64 / elapsed.as_secs_f64() / 1e8
    );
}
