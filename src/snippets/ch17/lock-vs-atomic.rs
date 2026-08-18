use std::sync::Mutex;
use std::sync::atomic::{AtomicU64, Ordering};
use std::thread;
use std::time::Instant;

fn main() {
    let iters = 5_000_000u64;

    let counter = AtomicU64::new(0);
    let start = Instant::now();
    thread::scope(|s| {
        for _ in 0..2 {
            s.spawn(|| {
                for _ in 0..iters {
                    counter.fetch_add(1, Ordering::Relaxed);
                }
            });
        }
    });
    println!("AtomicU64 : {:>9.3?} (計 {})", start.elapsed(), counter.load(Ordering::Relaxed));

    let counter = Mutex::new(0u64);
    let start = Instant::now();
    thread::scope(|s| {
        for _ in 0..2 {
            s.spawn(|| {
                for _ in 0..iters {
                    *counter.lock().unwrap() += 1;
                }
            });
        }
    });
    println!("Mutex<u64>: {:>9.3?} (計 {})", start.elapsed(), *counter.lock().unwrap());
}
