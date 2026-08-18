fn main() {
    // 0.1 を1000万回足す。正解は 1,000,000
    let n = 10_000_000;

    // (1) 素朴に足す
    let mut plain = 0.0f32;
    for _ in 0..n {
        plain += 0.1;
    }

    // (2) Kahanの総和: こぼれた誤差 c を覚えておき、次の加算で戻す
    let mut sum = 0.0f32;
    let mut c = 0.0f32;
    for _ in 0..n {
        let y = 0.1 - c;
        let t = sum + y;
        c = (t - sum) - y; // この1行が「こぼれた分」を回収する
        sum = t;
    }

    // (3) 累積だけ f64 で行う
    let mut wide = 0.0f64;
    for _ in 0..n {
        wide += 0.1f32 as f64;
    }

    println!("f32 素朴   : {plain}");
    println!("f32 Kahan  : {sum}");
    println!("f64 で累積 : {wide:.3}");
    println!("正解       : 1000000");
}
