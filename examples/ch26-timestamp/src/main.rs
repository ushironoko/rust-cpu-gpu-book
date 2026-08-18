//! 26章: GPUのタイムスタンプクエリで「カーネルだけの時間」を測る。
//! 実行: cd examples && cargo run --release -p ch26-timestamp

use std::num::NonZeroU64;
use std::time::Instant;
use wgpu::util::DeviceExt;

const N: usize = 16 * 1024 * 1024;

fn main() {
    let instance = wgpu::Instance::new(wgpu::InstanceDescriptor::new_without_display_handle());
    let adapter =
        pollster::block_on(instance.request_adapter(&wgpu::RequestAdapterOptions::default()))
            .expect("GPUが見つかりません");
    println!("GPU: {}", adapter.get_info().name);
    if !adapter.features().contains(wgpu::Features::TIMESTAMP_QUERY) {
        println!("このGPUはタイムスタンプクエリに対応していません");
        return;
    }
    let (device, queue) = pollster::block_on(adapter.request_device(&wgpu::DeviceDescriptor {
        label: None,
        required_features: wgpu::Features::TIMESTAMP_QUERY,
        required_limits: wgpu::Limits::downlevel_defaults(),
        experimental_features: wgpu::ExperimentalFeatures::disabled(),
        memory_hints: wgpu::MemoryHints::MemoryUsage,
        trace: wgpu::Trace::Off,
    }))
    .expect("デバイスの作成に失敗");

    // 計測対象: ch24と同じ要素ごとのハッシュ反復(16M要素)
    let shader = r#"
@group(0) @binding(0) var<storage, read> input: array<u32>;
@group(0) @binding(1) var<storage, read_write> output: array<u32>;

@compute @workgroup_size(256)
fn work(@builtin(workgroup_id) wgid: vec3<u32>, @builtin(local_invocation_id) lid: vec3<u32>) {
    let i = (wgid.y * 256u + wgid.x) * 256u + lid.x;
    if (i >= arrayLength(&input)) { return; }
    var x = input[i];
    for (var k = 0u; k < 64u; k = k + 1u) {
        x = x ^ (x << 13u); x = x ^ (x >> 17u); x = x ^ (x << 5u);
    }
    output[i] = x;
}
"#;
    let module = device.create_shader_module(wgpu::ShaderModuleDescriptor {
        label: None,
        source: wgpu::ShaderSource::Wgsl(shader.into()),
    });

    let data: Vec<u32> = (0..N as u32).collect();
    let buf_in = device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
        label: None,
        contents: bytemuck::cast_slice(&data),
        usage: wgpu::BufferUsages::STORAGE,
    });
    let buf_out = device.create_buffer(&wgpu::BufferDescriptor {
        label: None,
        size: (N * 4) as u64,
        usage: wgpu::BufferUsages::STORAGE,
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
            wgpu::BindGroupEntry { binding: 1, resource: buf_out.as_entire_binding() },
        ],
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

    // ---- タイムスタンプクエリの道具立て ----
    // パスの開始と終了で「GPU自身の時計」を記録する
    let query_set = device.create_query_set(&wgpu::QuerySetDescriptor {
        label: None,
        ty: wgpu::QueryType::Timestamp,
        count: 2,
    });
    let buf_resolve = device.create_buffer(&wgpu::BufferDescriptor {
        label: None,
        size: 16, // u64 × 2
        usage: wgpu::BufferUsages::QUERY_RESOLVE | wgpu::BufferUsages::COPY_SRC,
        mapped_at_creation: false,
    });
    let buf_ts_read = device.create_buffer(&wgpu::BufferDescriptor {
        label: None,
        size: 16,
        usage: wgpu::BufferUsages::COPY_DST | wgpu::BufferUsages::MAP_READ,
        mapped_at_creation: false,
    });

    let groups = ((N / 256).div_ceil(256)) as u32;
    // (大きい仕事, 小さい仕事) それぞれで ウォームアップ1回 + 計測3回
    for (label, gx, gy) in [("16M要素", 256u32, groups), ("256要素 ", 1, 1)] {
    for round in 0..4 {
        let wall = Instant::now();
        let mut encoder = device.create_command_encoder(&wgpu::CommandEncoderDescriptor::default());
        {
            let mut pass = encoder.begin_compute_pass(&wgpu::ComputePassDescriptor {
                label: None,
                timestamp_writes: Some(wgpu::ComputePassTimestampWrites {
                    query_set: &query_set,
                    beginning_of_pass_write_index: Some(0),
                    end_of_pass_write_index: Some(1),
                }),
            });
            pass.set_pipeline(&pipeline);
            pass.set_bind_group(0, &bind_group, &[]);
            pass.dispatch_workgroups(gx, gy, 1);
        }
        encoder.resolve_query_set(&query_set, 0..2, &buf_resolve, 0);
        encoder.copy_buffer_to_buffer(&buf_resolve, 0, &buf_ts_read, 0, 16);
        queue.submit([encoder.finish()]);

        let slice = buf_ts_read.slice(..);
        slice.map_async(wgpu::MapMode::Read, |r| r.expect("map失敗"));
        device.poll(wgpu::PollType::wait_indefinitely()).unwrap();
        let wall_time = wall.elapsed();

        let (t0, t1) = {
            let view = slice.get_mapped_range().unwrap();
            let ts: &[u64] = bytemuck::cast_slice(&view);
            (ts[0], ts[1])
        };
        buf_ts_read.unmap();

        // タイムスタンプの目盛り(tick)をナノ秒に換算する係数
        let period_ns = queue.get_timestamp_period() as f64;
        let kernel_ms = (t1.wrapping_sub(t0)) as f64 * period_ns / 1e6;
        if round > 0 {
            println!(
                "{label} カーネル(GPU時計): {kernel_ms:8.4}ms | 壁時計(submit→完了待ち): {:8.4}ms",
                wall_time.as_secs_f64() * 1e3
            );
        }
    }
    }
}
