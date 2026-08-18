fn main() {
    // macOSのAccelerateフレームワーク(BLAS実装)をリンクする
    #[cfg(target_os = "macos")]
    println!("cargo:rustc-link-lib=framework=Accelerate");
}
