use std::hint::black_box;
use std::time::Instant;

fn main() {
    let n = 10_000_000usize;
    let src: Vec<u32> = (0..n as u32).collect();

    // (1) 空の Vec に push: 容量が足りなくなるたびに再確保+コピー
    let start = Instant::now();
    let mut out = Vec::new();
    for &v in src.iter() {
        out.push(v as u64 * 2);
    }
    black_box(&out);
    println!("Vec::new + push     : {:>9.3?}", start.elapsed());
    drop(out);

    // (2) 容量を先に確保してから push
    let start = Instant::now();
    let mut out = Vec::with_capacity(n);
    for &v in src.iter() {
        out.push(v as u64 * 2);
    }
    black_box(&out);
    println!("with_capacity + push: {:>9.3?}", start.elapsed());
    drop(out);

    // (3) イテレータから collect
    let start = Instant::now();
    let out: Vec<u64> = src.iter().map(|&v| v as u64 * 2).collect();
    black_box(&out);
    println!("collect             : {:>9.3?}", start.elapsed());
}
