#![feature(portable_simd)]
use std::simd::f32x8;
use std::simd::num::SimdFloat;
use std::time::Instant;

fn main() {
    let n = 1_000_000;
    let passes = 20;
    let floats: Vec<f32> = (0..n).map(|i| (i % 100) as f32).collect();

    // スカラ: 1個ずつ足す
    let start = Instant::now();
    let mut total = 0.0f64;
    for _ in 0..passes {
        let mut s = 0.0f32;
        for &v in floats.iter() {
            s += v;
        }
        total += s as f64;
    }
    println!("スカラ: {:>9.3?} (sum={total:.0})", start.elapsed());

    // SIMD: 8レーンで足し、最後にレーンをまとめる
    let start = Instant::now();
    let mut total = 0.0f64;
    for _ in 0..passes {
        let mut acc = f32x8::splat(0.0);
        let mut chunks = floats.chunks_exact(8);
        for c in &mut chunks {
            acc += f32x8::from_slice(c);
        }
        let s: f32 = acc.reduce_sum() + chunks.remainder().iter().sum::<f32>();
        total += s as f64;
    }
    println!("f32x8 : {:>9.3?} (sum={total:.0})", start.elapsed());
}
