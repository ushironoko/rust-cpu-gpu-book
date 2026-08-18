use std::time::Instant;

// 疑似乱数(外部クレートなし)
fn xorshift(state: &mut u64) -> u64 {
    *state ^= *state << 13;
    *state ^= *state >> 7;
    *state ^= *state << 17;
    *state
}

fn main() {
    let n = 10_000_000;
    let mut state = 0x2545_F491_4F6C_DD1D_u64;
    let unsorted: Vec<u8> = (0..n)
        .map(|_| (xorshift(&mut state) & 0xFF) as u8)
        .collect();
    let mut sorted = unsorted.clone();
    sorted.sort_unstable();

    // まったく同じコードを、並び順だけ違う同じ内容のデータに適用する
    for (name, data) in [("未ソート", &unsorted), ("ソート済", &sorted)] {
        let start = Instant::now();
        let mut sum = 0u64;
        for &v in data.iter() {
            if v >= 128 {
                sum += v as u64;
            }
        }
        println!("{name}: {:>9.3?} (sum={sum})", start.elapsed());
    }
}
