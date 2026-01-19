use windows::core::PCWSTR;
use windows::Win32::Storage::FileSystem::GetDiskFreeSpaceExW;
use std::path::Path;

/// 安全封装：获取指定盘符的剩余空间（字节）
pub fn get_free_space(drive: &str) -> Result<u64, String> {
    let mut free_bytes_available: u64 = 0;
    let mut total_bytes: u64 = 0;
    let mut total_free_bytes: u64 = 0;

    // Windows API 需要以 \0 结尾的 UTF-16 宽字符串
    let path = format!("{}\\\0", drive);
    let wide: Vec<u16> = path.encode_utf16().collect();

    if let Err(e) = unsafe {
        GetDiskFreeSpaceExW(
            PCWSTR::from_raw(wide.as_ptr()),
            Some(&mut free_bytes_available),
            Some(&mut total_bytes),
            Some(&mut total_free_bytes),
        )
    } {
        return Err(format!("获取磁盘空间失败: {}", e.to_string()));
    }

    Ok(free_bytes_available)
}

pub fn extract_drive_letter(path: &str) -> Option<String> {
    let p = Path::new(path);
    if let Some(prefix) = p.components().next() {
        if let std::path::Component::Prefix(pref) = prefix {
            return Some(pref.as_os_str().to_string_lossy().to_string());
        }
    }
    None
}
