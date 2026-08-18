fn main() {
    let v = vec![10u8, 20, 30];
    let i = std::hint::black_box(7usize); // 範囲外の添字
    // 検査つきなら panic するが……
    let x = unsafe { *v.get_unchecked(i) };
    println!("v[{i}] = {x} (?!)");
}
