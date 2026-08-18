use criterion::{Criterion, criterion_group, criterion_main};
use std::hint::black_box;

// 7章「Vecを作る3つの方法」をベンチマークにしたもの

fn build_push(src: &[u32]) -> Vec<u64> {
    let mut out = Vec::new();
    for &v in src {
        out.push(v as u64 * 2);
    }
    out
}

fn build_with_capacity(src: &[u32]) -> Vec<u64> {
    let mut out = Vec::with_capacity(src.len());
    for &v in src {
        out.push(v as u64 * 2);
    }
    out
}

fn build_collect(src: &[u32]) -> Vec<u64> {
    src.iter().map(|&v| v as u64 * 2).collect()
}

fn bench_build(c: &mut Criterion) {
    let src: Vec<u32> = (0..1_000_000).collect();
    // iter_with_large_drop: 作った Vec の解放(drop)は計測に含めない
    c.bench_function("push", |b| {
        b.iter_with_large_drop(|| build_push(black_box(&src)))
    });
    c.bench_function("with_capacity", |b| {
        b.iter_with_large_drop(|| build_with_capacity(black_box(&src)))
    });
    c.bench_function("collect", |b| {
        b.iter_with_large_drop(|| build_collect(black_box(&src)))
    });
}

criterion_group!(benches, bench_build);
criterion_main!(benches);
