use std::path::Path;

/// ponytail: 检查当前进程是否以管理员身份运行
#[cfg(target_os = "windows")]
fn is_elevated() -> bool {
    use windows::Win32::Security::{
        GetTokenInformation, TokenElevation, TOKEN_ELEVATION, TOKEN_QUERY,
    };
    use windows::Win32::System::Threading::{GetCurrentProcess, OpenProcessToken};

    unsafe {
        let mut token = std::mem::zeroed();
        if OpenProcessToken(GetCurrentProcess(), TOKEN_QUERY, &mut token).is_err() {
            return false;
        }

        let mut elevation = TOKEN_ELEVATION::default();
        let mut size = std::mem::size_of::<TOKEN_ELEVATION>() as u32;
        if GetTokenInformation(
            token,
            TokenElevation,
            Some(&mut elevation as *mut _ as *mut std::ffi::c_void),
            size,
            &mut size,
        )
        .is_err()
        {
            return false;
        }

        elevation.TokenIsElevated != 0
    }
}

#[tauri::command]
pub fn create_link_auto(src: String, dst: String) -> Result<(), String> {
    let src_path = Path::new(&src);
    let dst_path = Path::new(&dst);

    if !src_path.exists() {
        return Err(format!("源路径不存在: {}", src));
    }

    if dst_path.exists() {
        std::fs::remove_file(&dst_path)
            .or_else(|_| std::fs::remove_dir_all(&dst_path))
            .map_err(|e| format!("无法覆盖目标: {}", e))?;
    }

    #[cfg(target_os = "windows")]
    {
        let result = if src_path.is_file() {
            std::os::windows::fs::symlink_file(src_path, dst_path)
        } else {
            std::os::windows::fs::symlink_dir(src_path, dst_path)
        };

        match result {
            Ok(()) => Ok(()),
            Err(e) => {
                let admin_info = if is_elevated() {
                    "（当前已是管理员）"
                } else {
                    "（未以管理员运行——请右键以管理员身份启动此程序）"
                };
                Err(format!("创建符号链接失败: {}\n{}", e, admin_info))
            }
        }
    }

    #[cfg(not(target_os = "windows"))]
    Err("不支持的操作系统".to_string())
}
