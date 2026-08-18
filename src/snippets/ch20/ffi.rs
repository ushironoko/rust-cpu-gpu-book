use std::hint::black_box;
use std::time::Instant;

use std::ffi::c_long;

// Cライブラリの関数を直接宣言する(labs = C言語のlongの絶対値)。
// Cのlongの幅はOS依存(64bit Linux/macOSでは64bit、Windowsでは32bit)
// なので、対応するRust型 c_long を使う
unsafe extern "C" {
    fn labs(x: c_long) -> c_long;
}

fn main() {
    let n = 100_000_000i64;

    // (1) Rustの .abs() : インライン化され、ベクトル化もされうる
    let start = Instant::now();
    let mut sum = 0i64;
    for i in -n / 2..n / 2 {
        sum = sum.wrapping_add(black_box(i).abs());
    }
    println!("Rust abs : {:>9.3?} (sum={sum})", start.elapsed());

    // (2) C関数へのFFI呼び出し: 呼び出し境界を毎回越える
    let start = Instant::now();
    let mut sum = 0i64;
    for i in -n / 2..n / 2 {
        sum = sum.wrapping_add(unsafe { labs(black_box(i) as c_long) } as i64);
    }
    println!("C labs   : {:>9.3?} (sum={sum})", start.elapsed());
}
