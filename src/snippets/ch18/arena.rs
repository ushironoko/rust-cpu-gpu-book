use std::hint::black_box;
use std::time::Instant;

struct BoxNode {
    value: u64,
    next: Option<Box<BoxNode>>,
}

struct ArenaNode {
    value: u64,
    next: u32, // アリーナ内の添字。u32::MAXを終端とする
}

fn main() {
    let n = 1_000_000u32;

    // (1) ノードごとにヒープ確保する連結リスト
    let start = Instant::now();
    let mut head: Option<Box<BoxNode>> = None;
    for i in 0..n {
        head = Some(Box::new(BoxNode { value: i as u64, next: head.take() }));
    }
    println!("Box   構築: {:>9.3?}", start.elapsed());

    let start = Instant::now();
    let mut sum = 0u64;
    let mut cur = head.as_deref();
    while let Some(node) = cur {
        sum = sum.wrapping_add(node.value);
        cur = node.next.as_deref();
    }
    println!("Box   走査: {:>9.3?} (sum={sum})", start.elapsed());

    // 再帰dropのスタックオーバーフローを避けるため手動で解体しつつ計測
    let start = Instant::now();
    let mut cur = head;
    while let Some(mut node) = cur {
        cur = node.next.take();
    }
    println!("Box   解放: {:>9.3?}", start.elapsed());

    // (2) アリーナ(1本のVec)にまとめて置く連結リスト
    let start = Instant::now();
    let mut arena: Vec<ArenaNode> = Vec::with_capacity(n as usize);
    let mut head = u32::MAX;
    for i in 0..n {
        arena.push(ArenaNode { value: i as u64, next: head });
        head = i;
    }
    println!("アリーナ構築: {:>9.3?}", start.elapsed());

    let start = Instant::now();
    let mut sum = 0u64;
    let mut cur = head;
    while cur != u32::MAX {
        let node = &arena[cur as usize];
        sum = sum.wrapping_add(node.value);
        cur = node.next;
    }
    println!("アリーナ走査: {:>9.3?} (sum={sum})", start.elapsed());

    let start = Instant::now();
    drop(arena);
    black_box(());
    println!("アリーナ解放: {:>9.3?}", start.elapsed());
}
