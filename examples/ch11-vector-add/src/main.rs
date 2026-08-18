//! 11章: wgpu によるベクトル加算。
//! 実行: cargo run --release -p ch11-vector-add

use std::num::NonZeroU64;
use std::time::Instant;
use wgpu::util::DeviceExt;

fn main() {
    let n = 1_000_000usize;
    let a: Vec<f32> = (0..n).map(|i| i as f32).collect();
    let b: Vec<f32> = (0..n).map(|i| (i * 2) as f32).collect();

    // ---- 1. GPUへの接続 ----
    // Instance(wgpu全体の状態) → Adapter(物理GPU) → Device(論理デバイス) + Queue(コマンド送信口)
    let instance = wgpu::Instance::new(wgpu::InstanceDescriptor::new_without_display_handle());
    let adapter =
        pollster::block_on(instance.request_adapter(&wgpu::RequestAdapterOptions::default()))
            .expect("GPUが見つかりません");
    println!("GPU: {}", adapter.get_info().name);

    let (device, queue) = pollster::block_on(adapter.request_device(&wgpu::DeviceDescriptor {
        label: None,
        required_features: wgpu::Features::empty(),
        required_limits: wgpu::Limits::downlevel_defaults(),
        experimental_features: wgpu::ExperimentalFeatures::disabled(),
        memory_hints: wgpu::MemoryHints::MemoryUsage,
        trace: wgpu::Trace::Off,
    }))
    .expect("デバイスの作成に失敗");

    // ---- 2. シェーダのコンパイル ----
    let module = device.create_shader_module(wgpu::include_wgsl!("add.wgsl"));

    // ---- 3. バッファの用意 ----
    // 入力2本(VRAM上、CPUから初期データを書き込む)
    let buf_a = device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
        label: Some("a"),
        contents: bytemuck::cast_slice(&a),
        usage: wgpu::BufferUsages::STORAGE,
    });
    let buf_b = device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
        label: Some("b"),
        contents: bytemuck::cast_slice(&b),
        usage: wgpu::BufferUsages::STORAGE,
    });
    // 出力(VRAM上)
    let buf_c = device.create_buffer(&wgpu::BufferDescriptor {
        label: Some("c"),
        size: (n * 4) as u64,
        usage: wgpu::BufferUsages::STORAGE | wgpu::BufferUsages::COPY_SRC,
        mapped_at_creation: false,
    });
    // CPUから読み出すための転送先バッファ
    let buf_read = device.create_buffer(&wgpu::BufferDescriptor {
        label: Some("readback"),
        size: (n * 4) as u64,
        usage: wgpu::BufferUsages::COPY_DST | wgpu::BufferUsages::MAP_READ,
        mapped_at_creation: false,
    });

    // ---- 4. バインドグループ: シェーダの binding 番号とバッファを対応付ける ----
    let bgl = device.create_bind_group_layout(&wgpu::BindGroupLayoutDescriptor {
        label: None,
        entries: &[
            buffer_entry(0, true),  // a: 読み取り専用
            buffer_entry(1, true),  // b: 読み取り専用
            buffer_entry(2, false), // c: 書き込み可
        ],
    });
    let bind_group = device.create_bind_group(&wgpu::BindGroupDescriptor {
        label: None,
        layout: &bgl,
        entries: &[
            wgpu::BindGroupEntry {
                binding: 0,
                resource: buf_a.as_entire_binding(),
            },
            wgpu::BindGroupEntry {
                binding: 1,
                resource: buf_b.as_entire_binding(),
            },
            wgpu::BindGroupEntry {
                binding: 2,
                resource: buf_c.as_entire_binding(),
            },
        ],
    });

    // ---- 5. パイプライン: シェーダ+レイアウトを実行可能な形に ----
    let layout = device.create_pipeline_layout(&wgpu::PipelineLayoutDescriptor {
        label: None,
        bind_group_layouts: &[Some(&bgl)],
        immediate_size: 0,
    });
    let pipeline = device.create_compute_pipeline(&wgpu::ComputePipelineDescriptor {
        label: None,
        layout: Some(&layout),
        module: &module,
        entry_point: Some("add"),
        compilation_options: wgpu::PipelineCompilationOptions::default(),
        cache: None,
    });

    // ---- 6. コマンドを記録して送信 ----
    let start = Instant::now();
    let mut encoder = device.create_command_encoder(&wgpu::CommandEncoderDescriptor::default());
    {
        let mut pass = encoder.begin_compute_pass(&wgpu::ComputePassDescriptor::default());
        pass.set_pipeline(&pipeline);
        pass.set_bind_group(0, &bind_group, &[]);
        // 100万要素 ÷ ワークグループサイズ64 = 15625個のワークグループを起動
        pass.dispatch_workgroups(n.div_ceil(64) as u32, 1, 1);
    }
    // 結果を読み出し用バッファへコピーするコマンドも記録
    encoder.copy_buffer_to_buffer(&buf_c, 0, &buf_read, 0, buf_c.size());
    queue.submit([encoder.finish()]);

    // ---- 7. 結果の読み出し ----
    let slice = buf_read.slice(..);
    slice.map_async(wgpu::MapMode::Read, |r| {
        r.expect("バッファのマップに失敗しました");
    });
    device.poll(wgpu::PollType::wait_indefinitely()).unwrap();
    let data = slice.get_mapped_range().unwrap();
    let c: Vec<f32> = bytemuck::allocation::pod_collect_to_vec(&data);
    println!("GPU実行+読み出し: {:?}", start.elapsed());

    // ---- 8. CPUとの比較と検証 ----
    let start = Instant::now();
    let c_cpu: Vec<f32> = a.iter().zip(&b).map(|(x, y)| x + y).collect();
    println!("CPU(1コア)      : {:?}", start.elapsed());

    let ok = c == c_cpu;
    println!("検証: {} (c[10] = {})", if ok { "OK" } else { "NG" }, c[10]);
}

// BindGroupLayoutEntry の定型を関数にまとめたもの
fn buffer_entry(binding: u32, read_only: bool) -> wgpu::BindGroupLayoutEntry {
    wgpu::BindGroupLayoutEntry {
        binding,
        visibility: wgpu::ShaderStages::COMPUTE,
        ty: wgpu::BindingType::Buffer {
            ty: wgpu::BufferBindingType::Storage { read_only },
            min_binding_size: Some(NonZeroU64::new(4).unwrap()),
            has_dynamic_offset: false,
        },
        count: None,
    }
}
