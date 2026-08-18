use std::time::Instant;

fn main() {
    // (1) OSスレッドを1万本
    let start = Instant::now();
    let handles: Vec<_> = (0..10_000)
        .map(|i| std::thread::spawn(move || i as u64 * 2))
        .collect();
    let sum: u64 = handles.into_iter().map(|h| h.join().unwrap()).sum();
    println!("OSスレッド   1万: {:>9.3?} (sum={sum})", start.elapsed());

    // (2) tokioタスクを10万個
    let rt = tokio::runtime::Runtime::new().unwrap();
    let start = Instant::now();
    let sum: u64 = rt.block_on(async {
        let handles: Vec<_> = (0..100_000)
            .map(|i| tokio::spawn(async move { i as u64 * 2 }))
            .collect();
        let mut sum = 0u64;
        for h in handles {
            sum += h.await.unwrap();
        }
        sum
    });
    println!("tokioタスク 10万: {:>9.3?} (sum={sum})", start.elapsed());
}
