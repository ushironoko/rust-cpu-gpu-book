use std::sync::atomic::{AtomicI32, AtomicUsize, Ordering::*};
use std::thread;

// ストア→ロードの並べ替えを観測するリトマステスト。
// 2つのスレッドが同時に「自分の変数に1を書く → 相手の変数を読む」。
// 命令どおりの順序で実行されるなら、両方が0を読むことはありえない。
fn litmus(trials: usize, seqcst: bool) -> usize {
    let x = AtomicI32::new(0);
    let y = AtomicI32::new(0);
    let r2 = AtomicI32::new(0);
    let bar = AtomicUsize::new(0);

    // 2スレッド用のバリア: 両方が到達するまで待つ
    let barrier = |target: usize| {
        bar.fetch_add(1, AcqRel);
        while bar.load(Acquire) < target {
            std::hint::spin_loop();
        }
    };

    let mut both_zero = 0;
    thread::scope(|s| {
        // スレッドB
        s.spawn(|| {
            for t in 0..trials {
                y.store(0, Relaxed);
                barrier(4 * t + 2); // 準備完了を待ち合わせ
                if seqcst {
                    y.store(1, SeqCst);
                    r2.store(x.load(SeqCst), Relaxed);
                } else {
                    y.store(1, Relaxed);
                    r2.store(x.load(Relaxed), Relaxed);
                }
                barrier(4 * t + 4); // 実行完了を待ち合わせ
            }
        });
        // スレッドA(このスレッドが判定も行う)
        for t in 0..trials {
            x.store(0, Relaxed);
            barrier(4 * t + 2);
            let r1 = if seqcst {
                x.store(1, SeqCst);
                y.load(SeqCst)
            } else {
                x.store(1, Relaxed);
                y.load(Relaxed)
            };
            barrier(4 * t + 4);
            if r1 == 0 && r2.load(Relaxed) == 0 {
                both_zero += 1;
            }
        }
    });
    both_zero
}

fn main() {
    let trials = 200_000;
    println!(
        "Relaxed: {trials}回中 {:>6}回、両方が0 (並べ替えを観測)",
        litmus(trials, false)
    );
    println!(
        "SeqCst : {trials}回中 {:>6}回、両方が0",
        litmus(trials, true)
    );
}
