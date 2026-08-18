use std::time::Instant;

fn main() {
    // u64 が800万要素 = 64MB。キャッシュに収まらない大きさにする
    let n = 8_000_000;
    let data: Vec<u64> = (0..n as u64).collect();

    // (1) 全要素を順に読む
    let start = Instant::now();
    let mut sum = 0u64;
    for i in 0..n {
        sum = sum.wrapping_add(data[i]);
    }
    println!("全要素   ({n} 回の読み出し): {:>9.3?}", start.elapsed());
    assert!(sum != 0);

    // (2) 8要素おきに読む(読み出し回数は 1/8)
    let start = Instant::now();
    let mut sum = 0u64;
    let mut i = 0;
    while i < n {
        sum = sum.wrapping_add(data[i]);
        i += 8;
    }
    println!("8個おき ({} 回の読み出し): {:>9.3?}", n / 8, start.elapsed());
    assert!(sum != 0);
}
