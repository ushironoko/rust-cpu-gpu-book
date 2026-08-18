use std::collections::HashSet;
use std::hint::black_box;
use std::time::Instant;

fn main() {
    // 0..1000万の範囲の整数200万個の「所属判定」を2000万回
    let range = 10_000_000u32;
    let members: Vec<u32> = (0..range).filter(|x| x % 5 == 0).collect();
    let queries = 20_000_000u32;

    let set: HashSet<u32> = members.iter().copied().collect();
    let mut bits = vec![0u64; (range as usize + 63) / 64];
    for &m in &members {
        bits[(m / 64) as usize] |= 1 << (m % 64);
    }

    let start = Instant::now();
    let mut count = 0u32;
    for i in 0..queries {
        let q = i % range;
        if set.contains(&q) { count += 1; }
    }
    println!("HashSet : {:>9.3?} (count={count})", start.elapsed());

    let start = Instant::now();
    let mut count = 0u32;
    for i in 0..queries {
        let q = i % range;
        if bits[(q / 64) as usize] & (1 << (q % 64)) != 0 { count += 1; }
    }
    println!("ビット列: {:>9.3?} (count={count})", start.elapsed());
    black_box(count);
}
