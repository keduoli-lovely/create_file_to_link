// fn main() {
//     tauri_build::build()
// }

fn main() {
    let mut windows_attributes = tauri_build::WindowsAttributes::new();

    // 仅在非 debug 模式下要求管理员权限
    if !cfg!(debug_assertions) {
        windows_attributes = windows_attributes.app_manifest(include_str!("admin.exe.manifest"));
    }

    tauri_build::try_build(tauri_build::Attributes::new().windows_attributes(windows_attributes))
        .expect("failed to run tauri-build");
}

