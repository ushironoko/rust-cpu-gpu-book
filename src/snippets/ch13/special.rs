fn main() {
    // NaN は ==, <, >, <=, >= の比較にすべて「偽」で答える(!= だけが真)
    let nan = f64::NAN;
    println!("NaN == NaN : {}", nan == nan);
    println!("NaN <  1.0 : {}", nan < 1.0);
    println!("NaN >  1.0 : {}", nan > 1.0);

    // だから f64 は Ord を実装せず、sort() が直接使えない。
    // 全順序が必要な場面には total_cmp を使う
    let mut v = vec![3.0, f64::NAN, 1.0, 2.0];
    v.sort_by(f64::total_cmp);
    println!("total_cmp でソート: {v:?}");

    println!();
    // 正規化数の下限を割っても、精度を落としながら少しだけ粘れる
    println!("f32 の最小の正規化数      : {:e}", f32::MIN_POSITIVE);
    println!("それを8で割る(非正規化数) : {:e}", f32::MIN_POSITIVE / 8.0);
    println!("表現できる最小の正の値    : {:e}", f32::from_bits(1));

    println!();
    // 符号つきゼロ: 等しいのに割ると符号が現れる
    println!("0.0 == -0.0 : {}", 0.0f64 == -0.0f64);
    println!("1.0 /  0.0  = {}", 1.0f64 / 0.0);
    println!("1.0 / -0.0  = {}", 1.0f64 / -0.0);
}
