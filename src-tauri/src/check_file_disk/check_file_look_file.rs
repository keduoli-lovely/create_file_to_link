use std::{
    fs::{read_dir, OpenOptions},
    os::windows::fs::OpenOptionsExt,
    path::Path,
};

pub fn check_file_look_file(path_list: Vec<String>) -> Result<u64, String> {
    let mut lock_path_list: Vec<std::fs::File> = vec![];
    let mut all_file_size = 0u64;

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
                Ok(file) => {
                    // 获取文件大小
                    if let Ok(one_file_size) = std::fs::metadata(&path_v1) {
                        all_file_size += one_file_size.len();
                    }
                    lock_path_list.push(file)
                }
                Err(err) => {
                    return Err(err);
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
                    return Err(format!(
                        "检查{}权限时出错: {}",
                        row_path.clone(),
                        err.to_string()
                    ));
                }
            }
        }
    }

    Ok(all_file_size)
}

fn try_lock_file(_file_path: &Path) -> Result<std::fs::File, String> {
    match OpenOptions::new()
        .read(true)
        .write(true)
        .share_mode(0)
        .open(_file_path)
    {
        Ok(v) => Ok(v),
        Err(e) => Err(format!(
            "检查{}权限时出错: {}",
            _file_path.display().to_string(),
            e.to_string()
        )),
    }
}
