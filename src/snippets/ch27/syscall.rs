use std::hint::black_box;
use std::time::Instant;

unsafe extern "C" {
    fn getpid() -> i32;
}

#[inline(never)]
fn plain_function(x: i32) -> i32 {
    black_box(x + 1)
}

fn main() {
    let n = 5_000_000;

    let start = Instant::now();
    let mut acc = 0i64;
    for i in 0..n {
        acc += plain_function(i) as i64;
    }
    let t = start.elapsed();
    println!(
        "通常の関数呼び出し: {t:>9.3?} ({:5.1}ns/回, acc={acc})",
        t.as_nanos() as f64 / n as f64
    );

    let start = Instant::now();
    let mut acc = 0i64;
    for _ in 0..n {
        acc += unsafe { getpid() } as i64;
    }
    let t = start.elapsed();
    println!(
        "getpidシステムコール: {t:>7.3?} ({:5.1}ns/回, acc={acc})",
        t.as_nanos() as f64 / n as f64
    );
}
