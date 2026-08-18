use std::sync::mpsc;
use std::time::Instant;

fn main() {
    // 2スレッドがチャネルで打ち返し合う。1往復 = 2回のスレッド起床
    let rounds = 100_000;
    let (tx1, rx1) = mpsc::channel::<u64>();
    let (tx2, rx2) = mpsc::channel::<u64>();

    let handle = std::thread::spawn(move || {
        for _ in 0..rounds {
            let v = rx1.recv().unwrap();
            tx2.send(v + 1).unwrap();
        }
    });

    let start = Instant::now();
    let mut v = 0u64;
    for _ in 0..rounds {
        tx1.send(v).unwrap();
        v = rx2.recv().unwrap();
    }
    let t = start.elapsed();
    handle.join().unwrap();
    println!(
        "{rounds}往復: {t:?} (1往復あたり {:5.2}µs, v={v})",
        t.as_nanos() as f64 / rounds as f64 / 1000.0
    );
}
