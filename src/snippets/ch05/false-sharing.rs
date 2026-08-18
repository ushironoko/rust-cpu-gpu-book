use std::sync::atomic::{AtomicU64, Ordering};
use std::thread;
use std::time::Instant;

// 128バイト境界に整列した入れ物。2つのカウンタが必ず同じ
// キャッシュラインに載る(ライン幅が64でも128バイトでも)
#[repr(align(128))]
struct SameLine([AtomicU64; 2]);

// 1つで128バイトを占有する入れ物。2つ並べると
// カウンタは必ず別のキャッシュラインに載る
#[repr(align(128))]
struct Padded(AtomicU64);

fn main() {
    println!("利用可能な並列度: {:?}", thread::available_parallelism());

    let iters = 50_000_000u64;

    // (1) 同じキャッシュラインに載った2つのカウンタ
    let same = SameLine([AtomicU64::new(0), AtomicU64::new(0)]);
    let start = Instant::now();
    thread::scope(|s| {
        for c in &same.0 {
            s.spawn(move || {
                for _ in 0..iters {
                    c.fetch_add(1, Ordering::Relaxed);
                }
            });
        }
    });
    println!("同じライン: {:>9.3?}", start.elapsed());

    // (2) 別のキャッシュラインに載った2つのカウンタ
    let padded = [Padded(AtomicU64::new(0)), Padded(AtomicU64::new(0))];
    let start = Instant::now();
    thread::scope(|s| {
        for p in &padded {
            s.spawn(move || {
                for _ in 0..iters {
                    p.0.fetch_add(1, Ordering::Relaxed);
                }
            });
        }
    });
    println!("別のライン: {:>9.3?}", start.elapsed());
}
