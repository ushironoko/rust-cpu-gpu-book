use std::collections::{BTreeMap, HashMap};
use std::hash::{BuildHasherDefault, Hasher};
use std::hint::black_box;
use std::time::Instant;

// 整数キー向けの軽量ハッシュ(FxHash系の考え方)。
// 既定のSipHashと違い、HashDoS耐性を捨てて速度を取る
#[derive(Default)]
struct FastHasher(u64);
impl Hasher for FastHasher {
    fn write(&mut self, bytes: &[u8]) {
        for &b in bytes {
            self.0 = (self.0 ^ b as u64).wrapping_mul(0x100_0000_01b3);
        }
    }
    fn write_u64(&mut self, x: u64) {
        self.0 = (self.0 ^ x).wrapping_mul(0x9E37_79B9_7F4A_7C15);
    }
    fn finish(&self) -> u64 {
        self.0
    }
}

fn xorshift(state: &mut u64) -> u64 {
    *state ^= *state << 13;
    *state ^= *state >> 7;
    *state ^= *state << 17;
    *state
}

fn main() {
    let n = 1_000_000usize;
    let mut state = 0x2545_F491_4F6C_DD1Du64;
    let keys: Vec<u64> = (0..n as u64).map(|i| i * 2).collect(); // 偶数がキー
    let queries: Vec<u64> = (0..n)
        .map(|_| xorshift(&mut state) % (2 * n as u64))
        .collect();

    let hash: HashMap<u64, u64> = keys.iter().map(|&k| (k, k + 1)).collect();
    let fast: HashMap<u64, u64, BuildHasherDefault<FastHasher>> =
        keys.iter().map(|&k| (k, k + 1)).collect();
    let btree: BTreeMap<u64, u64> = keys.iter().map(|&k| (k, k + 1)).collect();
    let sorted = keys.clone(); // すでに昇順

    let start = Instant::now();
    let mut found = 0u64;
    for &q in &queries {
        if let Some(&v) = hash.get(&q) { found = found.wrapping_add(v); }
    }
    println!("HashMap(SipHash) : {:>9.3?} (found={found})", start.elapsed());

    let start = Instant::now();
    let mut found = 0u64;
    for &q in &queries {
        if let Some(&v) = fast.get(&q) { found = found.wrapping_add(v); }
    }
    println!("HashMap(自作Fx風): {:>9.3?} (found={found})", start.elapsed());

    let start = Instant::now();
    let mut found = 0u64;
    for &q in &queries {
        if let Some(&v) = btree.get(&q) { found = found.wrapping_add(v); }
    }
    println!("BTreeMap         : {:>9.3?} (found={found})", start.elapsed());

    let start = Instant::now();
    let mut found = 0u64;
    for &q in &queries {
        if let Ok(i) = sorted.binary_search(&q) { found = found.wrapping_add(sorted[i] + 1); }
    }
    println!("Vec二分探索      : {:>9.3?} (found={found})", start.elapsed());
    black_box(found);
}
