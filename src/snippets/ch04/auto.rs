use std::time::Instant;

fn main() {
    let n = 1_000_000;
    let passes = 20;
    let ints: Vec<i32> = (0..n).map(|i| (i % 100) as i32).collect();
    let floats: Vec<f32> = (0..n).map(|i| (i % 100) as f32).collect();

    // i32 の合計
    let start = Instant::now();
    let mut sum = 0i64;
    for _ in 0..passes {
        let mut s = 0i32;
        for &v in ints.iter() {
            s = s.wrapping_add(v);
        }
        sum += s as i64;
    }
    println!("i32 の合計: {:>9.3?} (sum={sum})", start.elapsed());

    // f32 の合計(まったく同じ書き方)
    let start = Instant::now();
    let mut sum = 0.0f64;
    for _ in 0..passes {
        let mut s = 0.0f32;
        for &v in floats.iter() {
            s += v;
        }
        sum += s as f64;
    }
    println!("f32 の合計: {:>9.3?} (sum={sum:.0})", start.elapsed());
}
