use std::time::Instant;

// 疑似乱数(外部クレートなしで済ませるための簡易実装)
fn xorshift(state: &mut u64) -> u64 {
    *state ^= *state << 13;
    *state ^= *state >> 7;
    *state ^= *state << 17;
    *state
}

fn main() {
    let n: usize = 16_000_000; // u32で64MB。キャッシュに収まらない大きさ

    // next[i] = 「次にたどる添字」。まずは順番どおり
    let seq: Vec<u32> = (0..n as u32).map(|i| (i + 1) % n as u32).collect();

    // 全要素をランダムな順で一巡する輪を作る(Sattolo法)。
    // i -> rand[i] とたどると、全要素を1回ずつ通って戻ってくる
    let mut rand: Vec<u32> = (0..n as u32).collect();
    let mut state = 0x2545_F491_4F6C_DD1D_u64;
    for i in (1..n).rev() {
        let j = (xorshift(&mut state) % i as u64) as usize;
        rand.swap(i, j);
    }

    // どちらも「配列を n 回たどる」点はまったく同じ
    for (name, next) in [("順番どおり", &seq), ("ランダム  ", &rand)] {
        let start = Instant::now();
        let mut pos = 0u32;
        for _ in 0..n {
            pos = next[pos as usize];
        }
        println!("{name}: {:>9.3?} (最終位置 {pos})", start.elapsed());
    }
}
