use std::mem::{align_of, size_of};

// フィールドの並び順はコンパイラにまかせる(既定)
#[allow(dead_code)]
struct Auto {
    a: u8,
    b: u64,
    c: u16,
}

// C言語と同じ規則: 宣言順に、アラインメントを守って並べる
#[allow(dead_code)]
#[repr(C)]
struct CLayout {
    a: u8,
    b: u64,
    c: u16,
}

fn main() {
    println!(
        "既定     : size = {:2} bytes, align = {} bytes",
        size_of::<Auto>(),
        align_of::<Auto>()
    );
    println!(
        "#[repr(C)]: size = {:2} bytes, align = {} bytes",
        size_of::<CLayout>(),
        align_of::<CLayout>()
    );
}
