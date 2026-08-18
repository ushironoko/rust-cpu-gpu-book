use std::mem::size_of;

fn main() {
    println!("u64            : {:2} bytes", size_of::<u64>());
    println!("Option<u64>    : {:2} bytes", size_of::<Option<u64>>());
    println!();
    println!("&u64           : {:2} bytes", size_of::<&u64>());
    println!("Option<&u64>   : {:2} bytes", size_of::<Option<&u64>>());
    println!();
    println!("Box<u8>        : {:2} bytes", size_of::<Box<u8>>());
    println!("Option<Box<u8>>: {:2} bytes", size_of::<Option<Box<u8>>>());
    println!();
    println!("bool           : {:2} bytes", size_of::<bool>());
    println!("Option<bool>   : {:2} bytes", size_of::<Option<bool>>());
    println!();
    println!("String         : {:2} bytes", size_of::<String>());
    println!("Option<String> : {:2} bytes", size_of::<Option<String>>());
}
