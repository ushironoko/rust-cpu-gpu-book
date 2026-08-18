use std::time::Instant;

fn main() {
    let size = 256 * 1024 * 1024;
    let buf = vec![1u8; size];
    let accesses = 4_000_000;

    let start = Instant::now();
    let mut sum = 0u64;
    let mut pos = 0usize;
    for _ in 0..accesses {
        sum = sum.wrapping_add(buf[pos] as u64);
        pos = (pos + 64) % size;
    }
    println!("64Bおき (ライン単位): {:>9.3?} (sum={sum})", start.elapsed());

    let start = Instant::now();
    let mut sum = 0u64;
    let mut pos = 0usize;
    for _ in 0..accesses {
        sum = sum.wrapping_add(buf[pos] as u64);
        pos = (pos + 4096 + 64) % size;
    }
    println!("4KBおき (ページ単位): {:>9.3?} (sum={sum})", start.elapsed());
}
