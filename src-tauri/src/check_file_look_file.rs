use std::{
    fs::{read_dir, OpenOptions},
    os::windows::fs::OpenOptionsExt,
    path::Path,
};
use tauri::{AppHandle, Emitter};

pub fn check_file_look_file(
    app: AppHandle,
    path_list: Vec<String>,
) -> Result<Vec<std::fs::File>, ()> {
    let mut lock_path_list: Vec<std::fs::File> = vec![];

    // 待处理路径
    let mut stack: Vec<String> = path_list;

    while let Some(row_path) = stack.pop() {
        let path_v1 = Path::new(&row_path);

        if !path_v1.exists() {
            continue;
        }

        if path_v1.is_file() {
            // 尝试独文件
            match try_lock_file(path_v1) {
                Ok(file) => lock_path_list.push(file),
                Err(err) => {
                    let _ = app.emit("lock_error", err);
                    return Err(());
                }
            }
        } else if path_v1.is_dir() {
            // 遍历目录，将子项加入 stack
            match read_dir(path_v1) {
                Ok(entries) => {
                    for entry in entries {
                        if let Ok(dir_entry) = entry {
                            let path = dir_entry.path();
                            stack.push(path.display().to_string());
                        }
                    }
                }
                Err(err) => {
                    let _ = app.emit("lock_error", (row_path.clone(), err.to_string()));
                    return Err(());
                }
            }
        }
    }

    Ok(lock_path_list)
}

fn try_lock_file(_file_path: &Path) -> Result<std::fs::File, (String, String)> {
    match OpenOptions::new()
        .read(true)
        .write(true)
        .share_mode(0)
        .open(_file_path)
    {
        Ok(v) => Ok(v),
        Err(e) => Err((_file_path.display().to_string(), e.to_string())),
    }
}
