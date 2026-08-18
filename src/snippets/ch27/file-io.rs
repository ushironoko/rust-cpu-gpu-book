use std::fs;
use std::time::Instant;

fn main() {
    // 64MBのファイルを用意する(プロセスIDつきの一時ファイル名にする)
    let path = std::env::temp_dir().join(format!("book_io_{}.bin", std::process::id()));
    let path = path.as_path();
    let size = 64 * 1024 * 1024usize;
    let data: Vec<u8> = (0..size).map(|i| (i % 251) as u8).collect();
    let start = Instant::now();
    fs::write(path, &data).unwrap();
    println!("書き込み(64MB)   : {:>9.3?}", start.elapsed());
    drop(data);

    // (1) fs::read で全体を読む(カーネル→ユーザー空間へのコピー)
    for round in 1..=2 {
        let start = Instant::now();
        let buf = fs::read(path).unwrap();
        let sum: u64 = buf.iter().map(|&b| b as u64).sum();
        println!(
            "fs::read {round}回目   : {:>9.3?} (sum={sum})",
            start.elapsed()
        );
    }

    // (2) mmap でアドレス空間に貼って読む(コピーなし、14章の実践)
    use std::os::fd::AsRawFd;
    let file = fs::File::open(path).unwrap();
    assert_eq!(file.metadata().unwrap().len() as usize, size);
    let start = Instant::now();
    let ptr = unsafe {
        libc::mmap(
            std::ptr::null_mut(),
            size,
            libc::PROT_READ,
            libc::MAP_PRIVATE,
            file.as_raw_fd(),
            0,
        )
    };
    assert!(ptr != libc::MAP_FAILED);
    // SAFETY: mmapが成功し、size バイトが読み取り可能
    let mapped: &[u8] = unsafe { std::slice::from_raw_parts(ptr as *const u8, size) };
    let sum: u64 = mapped.iter().map(|&b| b as u64).sum();
    println!("mmap + 走査      : {:>9.3?} (sum={sum})", start.elapsed());
    let rc = unsafe { libc::munmap(ptr, size) };
    assert_eq!(rc, 0);
    fs::remove_file(path).unwrap();
}
