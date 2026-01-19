use crate::{
    check_file_disk::check_file_look_file::check_file_look_file,
    check_file_disk::get_free_space::{extract_drive_letter, get_free_space},
};

fn format_gb(bytes: u64) -> String {
    format!("{:.2}", bytes as f64 / 1024.0 / 1024.0 / 1024.0)
}

pub fn file_and_disk_ok(go_list: Vec<String>, to_path: String) -> Result<(), String> {
    // 获取文件大小
    let all_size = match check_file_look_file(go_list) {
        Ok(size) => size,
        Err(e) => {
            return Err(e);
        }
    };

    // 获取目标盘符
    let letter = match extract_drive_letter(&to_path) {
        Some(l) => l,
        None => {
            return Err(format!("获取目标磁盘盘符失败: {}", to_path.clone()));
        }
    };

    // 获取目标盘符剩余空间
    let free = match get_free_space(&letter) {
        Ok(s) => s,
        Err(_) => {
            return Err(format!("获取目标磁盘剩余空间失败: {}", letter.clone()));
        }
    };

    if free < all_size + 100 * 1024 * 1024 {
        return Err(format!(
            "目标空间不足 盘符: {} 还需要 {} GB, 剩余 {} GB",
            letter,
            format_gb(all_size),
            format_gb(free)
        ));
    }
    Ok(())
}
