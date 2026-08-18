use std::collections::HashMap;
use std::hint::black_box;
use std::time::Instant;

fn main() {
    // 要素32個の小さな表を1000万回引く
    let n = 32u64;
    let lookups = 10_000_000;
    let pairs: Vec<(u64, u64)> = (0..n).map(|i| (i * 7 % 64, i)).collect();
    let map: HashMap<u64, u64> = pairs.iter().copied().collect();

    let start = Instant::now();
    let mut sum = 0u64;
    for i in 0..lookups {
        let q = black_box(i as u64 % 64);
        if let Some(&v) = map.get(&q) { sum = sum.wrapping_add(v); }
    }
    println!("HashMap    : {:>9.3?} (sum={sum})", start.elapsed());

    let start = Instant::now();
    let mut sum = 0u64;
    for i in 0..lookups {
        let q = black_box(i as u64 % 64);
        if let Some(&(_, v)) = pairs.iter().find(|&&(k, _)| k == q) {
            sum = sum.wrapping_add(v);
        }
    }
    println!("Vec線形探索: {:>9.3?} (sum={sum})", start.elapsed());
}
