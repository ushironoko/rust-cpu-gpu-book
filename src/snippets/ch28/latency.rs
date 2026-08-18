use std::collections::HashMap;
use std::time::Instant;

fn main() {
    // HashMapへの100万件のinsertを「1回ずつ」計測する
    let n = 1_000_000u64;
    let mut map: HashMap<u64, u64> = HashMap::new();
    let mut lat_ns: Vec<u64> = Vec::with_capacity(n as usize);

    for i in 0..n {
        let start = Instant::now();
        map.insert(i, i);
        lat_ns.push(start.elapsed().as_nanos() as u64);
    }

    lat_ns.sort_unstable();
    let pick = |p: f64| lat_ns[((n as f64 - 1.0) * p) as usize];
    let mean = lat_ns.iter().sum::<u64>() as f64 / n as f64;
    println!("平均   : {mean:8.0} ns");
    println!("中央値 : {:8} ns", pick(0.50));
    println!("p99    : {:8} ns", pick(0.99));
    println!("p99.9  : {:8} ns", pick(0.999));
    println!("最大   : {:8} ns  ← 外れ値(主因はリハッシュ=全件コピー)", lat_ns[n as usize - 1]);
}
