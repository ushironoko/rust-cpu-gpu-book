use std::hint::black_box;
use std::time::Instant;

trait Step {
    fn apply(&self, x: u64) -> u64;
}

struct AddOne;
struct XorMix;
impl Step for AddOne {
    fn apply(&self, x: u64) -> u64 {
        x.wrapping_add(1)
    }
}
impl Step for XorMix {
    fn apply(&self, x: u64) -> u64 {
        x ^ (x >> 3)
    }
}

// 同じ2種類の処理を enum でも表現する
enum StepE {
    AddOne,
    XorMix,
}
impl StepE {
    fn apply(&self, x: u64) -> u64 {
        match self {
            StepE::AddOne => x.wrapping_add(1),
            StepE::XorMix => x ^ (x >> 3),
        }
    }
}

fn main() {
    let n = 10_000_000usize;

    // 中身の型が実行時にしか決まらない、種類の混ざったリスト
    let dyns: Vec<Box<dyn Step>> = (0..n)
        .map(|i| -> Box<dyn Step> {
            if i % 2 == 0 { Box::new(AddOne) } else { Box::new(XorMix) }
        })
        .collect();
    let enums: Vec<StepE> = (0..n)
        .map(|i| if i % 2 == 0 { StepE::AddOne } else { StepE::XorMix })
        .collect();

    let start = Instant::now();
    let mut x = 0u64;
    for s in dyns.iter() {
        x = s.apply(x);
    }
    println!("Box<dyn Step>: {:>9.3?} (x={})", start.elapsed(), black_box(x));

    let start = Instant::now();
    let mut x = 0u64;
    for s in enums.iter() {
        x = s.apply(x);
    }
    println!("enum + match : {:>9.3?} (x={})", start.elapsed(), black_box(x));
}
