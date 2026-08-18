use std::time::Instant;

fn main() {
    let n = 10_000_000;
    let v: Vec<i32> = (0..n as i32).collect();
    let passes = 20;

    // (1) 添字アクセス。v[i] は範囲外なら panic する
    let start = Instant::now();
    let mut total = 0i64;
    for _ in 0..passes {
        let mut s = 0i32;
        for i in 0..n {
            s = s.wrapping_add(v[i]);
        }
        total += s as i64;
    }
    println!("添字 v[i]       : {:>9.3?} (total={total})", start.elapsed());

    // (2) イテレータ
    let start = Instant::now();
    let mut total = 0i64;
    for _ in 0..passes {
        let mut s = 0i32;
        for &x in v.iter() {
            s = s.wrapping_add(x);
        }
        total += s as i64;
    }
    println!("イテレータ      : {:>9.3?} (total={total})", start.elapsed());

    // (3) 実行時に決まる長さ m までの添字アクセス
    // (black_box で「コンパイル時には値がわからない」状況を作る)
    let m = std::hint::black_box(n - 1);
    assert!(m <= v.len());
    let start = Instant::now();
    let mut total = 0i64;
    for _ in 0..passes {
        let mut s = 0i32;
        for i in 0..m {
            s = s.wrapping_add(v[i]);
        }
        total += s as i64;
    }
    println!("添字 0..m       : {:>9.3?} (total={total})", start.elapsed());

    // (4) 先にスライスを切ってからイテレータ
    let start = Instant::now();
    let mut total = 0i64;
    for _ in 0..passes {
        let mut s = 0i32;
        for &x in &v[..m] {
            s = s.wrapping_add(x);
        }
        total += s as i64;
    }
    println!("スライス &v[..m]: {:>9.3?} (total={total})", start.elapsed());
}
