//! 24章: チャンク処理の「同期の形」を変えて全体時間を比べる。
//! 実行: cd examples && cargo run --release -p ch24-overlap

use std::num::NonZeroU64;
use std::time::Instant;
use wgpu::util::DeviceExt;

const CHUNKS: usize = 16;
const CHUNK_ELEMS: usize = 1024 * 1024; // 1チャンク = 4MB

struct Chunk {
    buf_in: wgpu::Buffer,
    buf_out: wgpu::Buffer,
    buf_read: wgpu::Buffer,
    bind_group: wgpu::BindGroup,
}

fn main() {
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

    let module = device.create_shader_module(wgpu::include_wgsl!("work.wgsl"));
    let storage = |binding: u32, read_only: bool| wgpu::BindGroupLayoutEntry {
        binding,
        visibility: wgpu::ShaderStages::COMPUTE,
        ty: wgpu::BindingType::Buffer {
            ty: wgpu::BufferBindingType::Storage { read_only },
            min_binding_size: Some(NonZeroU64::new(4).unwrap()),
            has_dynamic_offset: false,
        },
        count: None,
    };
    let bgl = device.create_bind_group_layout(&wgpu::BindGroupLayoutDescriptor {
        label: None,
        entries: &[storage(0, true), storage(1, false)],
    });
    let layout = device.create_pipeline_layout(&wgpu::PipelineLayoutDescriptor {
        label: None,
        bind_group_layouts: &[Some(&bgl)],
        immediate_size: 0,
    });
    let pipeline = device.create_compute_pipeline(&wgpu::ComputePipelineDescriptor {
        label: None,
        layout: Some(&layout),
        module: &module,
        entry_point: Some("work"),
        compilation_options: wgpu::PipelineCompilationOptions::default(),
        cache: None,
    });

    // チャンクごとのバッファ一式(入力・出力・読み戻し)
    let bytes = (CHUNK_ELEMS * 4) as u64;
    let chunks: Vec<Chunk> = (0..CHUNKS)
        .map(|c| {
            let data: Vec<u32> = (0..CHUNK_ELEMS as u32).map(|i| i ^ c as u32).collect();
            let buf_in = device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
                label: None,
                contents: bytemuck::cast_slice(&data),
                usage: wgpu::BufferUsages::STORAGE | wgpu::BufferUsages::COPY_DST,
            });
            let buf_out = device.create_buffer(&wgpu::BufferDescriptor {
                label: None,
                size: bytes,
                usage: wgpu::BufferUsages::STORAGE | wgpu::BufferUsages::COPY_SRC,
                mapped_at_creation: false,
            });
            let buf_read = device.create_buffer(&wgpu::BufferDescriptor {
                label: None,
                size: bytes,
                usage: wgpu::BufferUsages::COPY_DST | wgpu::BufferUsages::MAP_READ,
                mapped_at_creation: false,
            });
            let bind_group = device.create_bind_group(&wgpu::BindGroupDescriptor {
                label: None,
                layout: &bgl,
                entries: &[
                    wgpu::BindGroupEntry { binding: 0, resource: buf_in.as_entire_binding() },
                    wgpu::BindGroupEntry { binding: 1, resource: buf_out.as_entire_binding() },
                ],
            });
            Chunk { buf_in, buf_out, buf_read, bind_group }
        })
        .collect();

    let groups = (CHUNK_ELEMS / 256) as u32;
    let record = |c: &Chunk| {
        let mut encoder = device.create_command_encoder(&wgpu::CommandEncoderDescriptor::default());
        {
            let mut pass = encoder.begin_compute_pass(&wgpu::ComputePassDescriptor::default());
            pass.set_pipeline(&pipeline);
            pass.set_bind_group(0, &c.bind_group, &[]);
            pass.dispatch_workgroups(groups, 1, 1);
        }
        encoder.copy_buffer_to_buffer(&c.buf_out, 0, &c.buf_read, 0, bytes);
        encoder.finish()
    };
    let checksum = |c: &Chunk| -> u64 {
        let slice = c.buf_read.slice(..);
        let view = slice.get_mapped_range().unwrap();
        let words: &[u32] = bytemuck::cast_slice(&view);
        let sum = words.iter().fold(0u64, |a, &x| a.wrapping_add(x as u64));
        drop(view);
        c.buf_read.unmap();
        sum
    };

    // ウォームアップ(シェーダコンパイル等)
    queue.submit([record(&chunks[0])]);
    device.poll(wgpu::PollType::wait_indefinitely()).unwrap();

    // ---- (A) チャンクごとに完全同期 ----
    let start = Instant::now();
    let mut sum_a = 0u64;
    for c in &chunks {
        queue.submit([record(c)]);
        let slice = c.buf_read.slice(..);
        slice.map_async(wgpu::MapMode::Read, |r| r.expect("map失敗"));
        device.poll(wgpu::PollType::wait_indefinitely()).unwrap(); // 毎回GPUを待つ
        sum_a = sum_a.wrapping_add(checksum(c));
    }
    println!("(A) 1チャンクごとに同期  : {:>9.3?}", start.elapsed());

    // ---- (B) 全部投入してから一括で回収 ----
    let start = Instant::now();
    for c in &chunks {
        queue.submit([record(c)]); // 待たずに次を投入
    }
    for c in &chunks {
        c.buf_read.slice(..).map_async(wgpu::MapMode::Read, |r| r.expect("map失敗"));
    }
    device.poll(wgpu::PollType::wait_indefinitely()).unwrap(); // 待つのは1回
    let mut sum_b = 0u64;
    for c in &chunks {
        sum_b = sum_b.wrapping_add(checksum(c));
    }
    println!("(B) 全投入→一括回収      : {:>9.3?}", start.elapsed());

    assert_eq!(sum_a, sum_b);
    println!("検証: OK (checksum={sum_a})");
}
