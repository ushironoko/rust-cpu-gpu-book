use std::hint::black_box;

fn main() {
    // black_box で「実行時にしかわからない値」にする
    // (定数のままだとコンパイル時に検出されてビルドが止まる)
    let a: i32 = black_box(i32::MAX);
    let b = a + 1;
    println!("i32::MAX + 1 = {b}");
}
