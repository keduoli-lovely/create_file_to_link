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
