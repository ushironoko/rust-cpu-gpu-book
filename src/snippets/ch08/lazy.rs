use std::time::Instant;

fn slow_square(x: u64) -> u64 {
    // 意図的に重くした計算
    let mut acc = x;
    for _ in 0..100 {
        acc = acc.wrapping_mul(acc) ^ x;
    }
    acc
}

fn main() {
    let v: Vec<u64> = (0..1_000_000).collect();

    // (1) map を作っただけ(どこにも使っていない)
    let start = Instant::now();
    let _it = v.iter().map(|&x| slow_square(x));
    println!("mapを作っただけ: {:>12.3?}", start.elapsed());

    // (2) sum で最後まで実行する
    let start = Instant::now();
    let total: u64 = v.iter().map(|&x| slow_square(x)).sum();
    println!("sumまで実行    : {:>12.3?} (total={total})", start.elapsed());
}
