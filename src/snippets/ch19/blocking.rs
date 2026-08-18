use std::time::{Duration, Instant};

// 1スレッド構成のランタイムで、
// 「重い同期処理」が同居するタスクにどう影響するかを見る
fn main() {
    let rt = tokio::runtime::Builder::new_current_thread()
        .enable_time()
        .build()
        .unwrap();

    // (1) タスクAが std::thread::sleep でスレッドごと止める
    rt.block_on(async {
        let start = Instant::now();
        let b = tokio::spawn(async move {
            tokio::time::sleep(Duration::from_millis(50)).await;
            start.elapsed()
        });
        // タスクBが先にタイマーを登録できるよう、一度実行を譲る
        tokio::task::yield_now().await;
        let a = tokio::spawn(async {
            std::thread::sleep(Duration::from_millis(300)); // ブロッキング!
        });
        a.await.unwrap();
        let b_done = b.await.unwrap();
        println!("(1) ブロッキング同居: 50msのはずのタスクBの完了 = {b_done:?}");
    });

    // (2) 重い処理を spawn_blocking で専用スレッドへ逃がす
    rt.block_on(async {
        let start = Instant::now();
        let b = tokio::spawn(async move {
            tokio::time::sleep(Duration::from_millis(50)).await;
            start.elapsed()
        });
        tokio::task::yield_now().await;
        let a = tokio::task::spawn_blocking(|| {
            std::thread::sleep(Duration::from_millis(300));
        });
        a.await.unwrap();
        let b_done = b.await.unwrap();
        println!("(2) spawn_blocking : 50msのはずのタスクBの完了 = {b_done:?}");
    });
}
