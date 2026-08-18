use std::time::Instant;

// インライン化を禁止した小さな関数
#[inline(never)]
fn add_never(a: u64, b: u64) -> u64 {
    a.wrapping_add(b)
}

// 通常の小さな関数(インライン化するかはコンパイラが判断する)
fn add_auto(a: u64, b: u64) -> u64 {
    a.wrapping_add(b)
}

fn main() {
    let n = 100_000_000u64;

    let start = Instant::now();
    let mut sum = 0u64;
    for i in 0..n {
        sum = add_never(sum, i);
    }
    println!("inline(never): {:>9.3?} (sum={sum})", start.elapsed());

    let start = Instant::now();
    let mut sum = 0u64;
    for i in 0..n {
        sum = add_auto(sum, i);
    }
    println!("自動判断     : {:>9.3?} (sum={sum})", start.elapsed());
}
