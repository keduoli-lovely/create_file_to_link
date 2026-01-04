use std::path::Path;

#[tauri::command]
pub fn create_link_auto(src: String, dst: String) -> Result<(), String> {
    let src_path = Path::new(&src);
    let dst_path = Path::new(&dst);

    if !src_path.exists() {
        return Err(format!("源路径不存在: {}", src));
    }

    // 如果目标存在，删除（强制覆盖）
    if dst_path.exists() {
        std::fs::remove_file(&dst_path)
            .or_else(|_| std::fs::remove_dir_all(&dst_path))
            .map_err(|e| format!("无法覆盖目标: {}", e))?;
    }

    // 判断文件 or 文件夹
    if src_path.is_file() {
        create_file_link(src_path, dst_path)
    } else {
        create_dir_link(src_path, dst_path)
    }
}

fn create_file_link(src: &Path, dst: &Path) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::os::windows::fs::symlink_file(src, dst)
            .map_err(|e| format!("创建文件符号链接失败: {}", e))
    }

    #[cfg(not(target_os = "windows"))]
    {
        std::os::unix::fs::symlink(src, dst).map_err(|e| format!("创建文件符号链接失败: {}", e))
    }
}

fn create_dir_link(src: &Path, dst: &Path) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::os::windows::fs::symlink_dir(src, dst)
            .map_err(|e| format!("创建目录符号链接失败: {}", e))
    }

    #[cfg(not(target_os = "windows"))]
    {
        std::os::unix::fs::symlink(src, dst).map_err(|e| format!("创建目录符号链接失败: {}", e))
    }
}
