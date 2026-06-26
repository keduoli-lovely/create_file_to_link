/// 计算路径列表的总大小（递归目录），返回 (bytes, file_count)
#[tauri::command]
pub fn get_total_size(paths: Vec<String>) -> (u64, u64) {
    let mut total_size: u64 = 0;
    let mut total_count: u64 = 0;
    let mut stack: Vec<String> = paths;

    while let Some(row_path) = stack.pop() {
        let path = std::path::Path::new(&row_path);
        if !path.exists() {
            continue;
        }
        if path.is_file() {
            if let Ok(meta) = std::fs::metadata(path) {
                total_size += meta.len();
                total_count += 1;
            }
        } else if path.is_dir() {
            total_count += 1;
            if let Ok(entries) = std::fs::read_dir(path) {
                for entry in entries.flatten() {
                    stack.push(entry.path().to_string_lossy().to_string());
                }
            }
        }
    }
    (total_size, total_count)
}

fn format_size(bytes: u64) -> String {
    if bytes >= 1024 * 1024 * 1024 {
        format!("{:.2} GB", bytes as f64 / 1024.0 / 1024.0 / 1024.0)
    } else if bytes >= 1024 * 1024 {
        format!("{:.2} MB", bytes as f64 / 1024.0 / 1024.0)
    } else if bytes >= 1024 {
        format!("{:.2} KB", bytes as f64 / 1024.0)
    } else {
        format!("{} B", bytes)
    }
}

#[tauri::command]
pub fn is_symlink(path: String) -> bool {
    use std::fs;
    if let Ok(meta) = fs::symlink_metadata(&path) {
        return meta.file_type().is_symlink();
    }
    false
}

#[tauri::command]
pub fn file_or_dir(path: String) -> (bool, String) {
    if let Ok(_) = std::fs::exists(&path) {
        match std::fs::metadata(path) {
            Ok(file_info) => {
                if file_info.is_file() {
                    return (true, "file".to_string());
                } else if file_info.is_dir() {
                    return (true, "dir".to_string());
                }
            }
            Err(_) => {}
        }
    }
    (false, "null".to_string())
}
