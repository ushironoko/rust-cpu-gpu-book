use std::collections::LinkedList;
use std::time::Instant;

fn main() {
    let n = 1_000_000u64;

    let vec: Vec<u64> = (0..n).collect();
    let list: LinkedList<u64> = (0..n).collect();

    let start = Instant::now();
    let sum: u64 = vec.iter().sum();
    println!("Vec       : {:>9.3?} (sum={sum})", start.elapsed());

    let start = Instant::now();
    let sum: u64 = list.iter().sum();
    println!("LinkedList: {:>9.3?} (sum={sum})", start.elapsed());
}
