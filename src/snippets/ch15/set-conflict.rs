use std::time::Instant;

fn main() {
    // 64か所を何度も巡回して読む。触るデータ量は 64 × 8バイトだけ
    let slots = 64;
    let rounds = 2_000_000;

    for (name, stride) in [("4096バイトおき(2のべき乗)", 4096usize), ("4160バイトおき(+64ずらし)", 4160)] {
        let buf = vec![1u8; slots * stride + 8];
        let start = Instant::now();
        let mut sum = 0u64;
        for _ in 0..rounds {
            for i in 0..slots {
                let p = i * stride;
                let v = u64::from_ne_bytes(buf[p..p + 8].try_into().unwrap());
                sum = sum.wrapping_add(v);
            }
        }
        println!("{name}: {:>9.3?} (sum={sum})", start.elapsed());
    }
}
