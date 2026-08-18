//! 23章: GPUのreduction(総和)を3段階で最適化する。
//! 実行: cd examples && cargo run --release -p ch23-reduction

use std::num::NonZeroU64;
use std::time::Instant;
use wgpu::util::DeviceExt;

fn xorshift(state: &mut u64) -> u64 {
    *state ^= *state << 13;
    *state ^= *state >> 7;
    *state ^= *state << 17;
    *state
}

fn main() {
    let n = 16 * 1024 * 1024usize; // 1677万要素
    let mut state = 0x2545_F491_4F6C_DD1Du64;
    let data: Vec<u32> = (0..n).map(|_| (xorshift(&mut state) & 0x7F) as u32).collect();

    // CPUでの答えと時間
    let start = Instant::now();
    let expected: u64 = data.iter().map(|&x| x as u64).sum();
    let cpu_time = start.elapsed();
    println!("CPU(1コア)     : {cpu_time:>9.3?} (sum={expected})");

    // ---- GPUの準備 ----
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

    let module = device.create_shader_module(wgpu::include_wgsl!("reduce.wgsl"));
    let buf_in = device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
        label: Some("input"),
        contents: bytemuck::cast_slice(&data),
        usage: wgpu::BufferUsages::STORAGE,
    });
    let buf_result = device.create_buffer(&wgpu::BufferDescriptor {
        label: Some("result"),
        size: 4,
        usage: wgpu::BufferUsages::STORAGE | wgpu::BufferUsages::COPY_SRC | wgpu::BufferUsages::COPY_DST,
        mapped_at_creation: false,
    });
    let buf_read = device.create_buffer(&wgpu::BufferDescriptor {
        label: Some("read"),
        size: 4,
        usage: wgpu::BufferUsages::COPY_DST | wgpu::BufferUsages::MAP_READ,
        mapped_at_creation: false,
    });

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
    let bind_group = device.create_bind_group(&wgpu::BindGroupDescriptor {
        label: None,
        layout: &bgl,
        entries: &[
            wgpu::BindGroupEntry { binding: 0, resource: buf_in.as_entire_binding() },
            wgpu::BindGroupEntry { binding: 1, resource: buf_result.as_entire_binding() },
        ],
    });
    let layout = device.create_pipeline_layout(&wgpu::PipelineLayoutDescriptor {
        label: None,
        bind_group_layouts: &[Some(&bgl)],
        immediate_size: 0,
    });
    let make_pipeline = |entry: &str| {
        device.create_compute_pipeline(&wgpu::ComputePipelineDescriptor {
            label: Some(entry),
            layout: Some(&layout),
            module: &module,
            entry_point: Some(entry),
            compilation_options: wgpu::PipelineCompilationOptions::default(),
            cache: None,
        })
    };

    // (バリアント名, エントリポイント, ディスパッチ形状)
    let groups_2d = ((n / 256).div_ceil(256)) as u32; // 256x256=65536グループ
    let variants: [(&str, &str, (u32, u32)); 3] = [
        ("v1 全部atomic     ", "reduce_atomic", (256, groups_2d)),
        ("v2 共有メモリの木 ", "reduce_shared", (256, groups_2d)),
        ("v3 64要素/スレッド", "reduce_multi", (1024, 1)),
    ];

    for (name, entry, (gx, gy)) in variants {
        let pipeline = make_pipeline(entry);
        // ウォームアップ1回 + 計測1回
        for round in 0..2 {
            queue.write_buffer(&buf_result, 0, &[0u8; 4]); // 合計を0に戻す
            let start = Instant::now();
            let mut encoder =
                device.create_command_encoder(&wgpu::CommandEncoderDescriptor::default());
            {
                let mut pass = encoder.begin_compute_pass(&wgpu::ComputePassDescriptor::default());
                pass.set_pipeline(&pipeline);
                pass.set_bind_group(0, &bind_group, &[]);
                pass.dispatch_workgroups(gx, gy, 1);
            }
            encoder.copy_buffer_to_buffer(&buf_result, 0, &buf_read, 0, 4);
            queue.submit([encoder.finish()]);
            let slice = buf_read.slice(..);
            slice.map_async(wgpu::MapMode::Read, |r| {
                r.expect("バッファのマップに失敗しました");
            });
            device.poll(wgpu::PollType::wait_indefinitely()).unwrap();
            let got = {
                let view = slice.get_mapped_range().unwrap();
                u32::from_ne_bytes(view[0..4].try_into().unwrap())
            };
            buf_read.unmap();
            if round == 1 {
                let ok = got as u64 == expected;
                println!(
                    "{name}: {:>9.3?} (sum={got}{})",
                    start.elapsed(),
                    if ok { "" } else { " 検証NG!" }
                );
            }
        }
    }
}
