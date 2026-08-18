use std::mem::size_of_val;

async fn tiny() -> u64 {
    1 + 1
}

// 4KBのバッファを .await をまたいで持つ
async fn holds_buffer() -> u64 {
    let buf = [7u8; 4096];
    tokio::task::yield_now().await; // ここで中断しうる
    buf.iter().map(|&b| b as u64).sum()
}

// 同じバッファでも .await の前に使い終わる
async fn drops_before_await() -> u64 {
    let sum = {
        let buf = [7u8; 4096];
        buf.iter().map(|&b| b as u64).sum()
    };
    tokio::task::yield_now().await;
    sum
}

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let f1 = tiny();
    let f2 = holds_buffer();
    let f3 = drops_before_await();
    println!("tiny               のFuture: {:>5} bytes", size_of_val(&f1));
    println!("バッファをまたぐ   のFuture: {:>5} bytes", size_of_val(&f2));
    println!("またぐ前に手放す   のFuture: {:>5} bytes", size_of_val(&f3));
    println!("結果: {} {} {}", f1.await, f2.await, f3.await);
}
