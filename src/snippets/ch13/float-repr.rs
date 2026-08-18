fn main() {
    println!("0.1 + 0.2 == 0.3 : {}", 0.1 + 0.2 == 0.3);
    println!("0.1 + 0.2        = {:.20}", 0.1 + 0.2);
    println!("0.3              = {:.20}", 0.3);
    println!();
    // 0.1 として格納されている64ビットの中身
    println!("0.1 のビット列:");
    let bits = 0.1f64.to_bits();
    println!("  符号: {:b}", bits >> 63);
    println!("  指数: {:011b}", (bits >> 52) & 0x7FF);
    println!("  仮数: {:052b}", bits & ((1 << 52) - 1));
}
