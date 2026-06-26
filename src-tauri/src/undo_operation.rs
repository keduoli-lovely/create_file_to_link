use serde::Deserialize;
use std::path::{Path, PathBuf};

#[derive(Deserialize)]
pub struct UndoItem {
    pub old: String,
    pub new: String,
    #[serde(rename = "linkPath")]
    pub link_path: String,
    #[serde(rename = "isCopy")]
    pub is_copy: bool,
    #[serde(rename = "isFile")]
    pub is_file: bool,
}

#[derive(serde::Serialize)]
pub struct UndoResult {
    pub old: String,
    pub new: String,
    pub success: bool,
    pub error: Option<String>,
}

/// 跨盘符安全的文件移动：先尝试 rename，失败则 copy + delete
fn safe_rename(src: &Path, dst: &Path, is_file: bool) -> Result<(), String> {
    // 确保目标父目录存在
    if let Some(parent) = dst.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("无法创建父目录: {}", e))?;
    }

    // 先尝试直接 rename（同盘符快）
    match std::fs::rename(src, dst) {
        Ok(_) => return Ok(()),
        Err(_e) => {
            // rename 失败（跨盘符等），使用 copy + delete
            if is_file {
                std::fs::copy(src, dst)
                    .map_err(|e| format!("复制文件失败: {}", e))?;
                std::fs::remove_file(src)
                    .map_err(|e| format!("删除源文件失败: {}", e))?;
            } else {
                copy_dir_recursive(src, dst)?;
                std::fs::remove_dir_all(src)
                    .map_err(|e| format!("删除源目录失败: {}", e))?;
            }
        }
    }
    Ok(())
}

/// 递归复制目录
fn copy_dir_recursive(src: &Path, dst: &Path) -> Result<(), String> {
    std::fs::create_dir_all(dst)
        .map_err(|e| format!("创建目标目录失败: {}", e))?;

    for entry in std::fs::read_dir(src).map_err(|e| format!("读取目录失败: {}", e))? {
        let entry = entry.map_err(|e| format!("读取条目失败: {}", e))?;
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());

        if src_path.is_dir() {
            copy_dir_recursive(&src_path, &dst_path)?;
        } else {
            std::fs::copy(&src_path, &dst_path)
                .map_err(|e| format!("复制文件失败: {}", e))?;
        }
    }
    Ok(())
}

/// 删除软链接（文件或目录）
fn remove_symlink(link_path: &Path) -> Result<(), String> {
    if !link_path.exists() {
        return Ok(());
    }
    if let Ok(meta) = std::fs::symlink_metadata(link_path) {
        if meta.file_type().is_symlink() {
            // 先尝试删文件软链接，失败则尝试删目录软链接
            std::fs::remove_file(link_path)
                .or_else(|_| std::fs::remove_dir(link_path))
                .map_err(|e| format!("无法删除软链接: {}", e))?;
        }
    }
    Ok(())
}

/// 删除文件或目录
fn remove_path(path: &Path, is_file: bool) -> Result<(), String> {
    if !path.exists() {
        return Ok(());
    }
    if is_file {
        std::fs::remove_file(path).map_err(|e| format!("无法删除文件: {}", e))
    } else {
        std::fs::remove_dir_all(path).map_err(|e| format!("无法删除目录: {}", e))
    }
}

#[tauri::command]
pub fn undo_operation(items: Vec<UndoItem>) -> Result<Vec<UndoResult>, String> {
    let mut results = Vec::new();

    for item in items {
        let link_path = PathBuf::from(&item.link_path);
        let new_path = PathBuf::from(&item.new);
        let old_path = PathBuf::from(&item.old);

        if !item.is_copy {
            // === 剪切撤销 ===
            if !new_path.exists() {
                results.push(UndoResult {
                    old: item.old.clone(),
                    new: item.new.clone(),
                    success: false,
                    error: Some("文件不存在，无法移回".to_string()),
                });
                continue;
            }

            // 先删软链接（否则 old 是软链接指向 new 时，copy 会冲突）
            let mut symlink_removed = false;
            let mut symlink_was_present = false;
            if link_path.exists() {
                if let Ok(meta) = std::fs::symlink_metadata(&link_path) {
                    if meta.file_type().is_symlink() {
                        symlink_was_present = true;
                        symlink_removed = remove_symlink(&link_path).is_ok();
                    }
                }
            }

            match safe_rename(&new_path, &old_path, item.is_file) {
                Ok(_) => {
                    // 移回成功，软链接已删或无需删除
                    results.push(UndoResult {
                        old: item.old.clone(),
                        new: item.new.clone(),
                        success: true,
                        error: None,
                    });
                }
                Err(e) => {
                    // 移回失败，重建软链接
                    if symlink_was_present && symlink_removed {
                        let recreate_src = if old_path.exists() { &old_path } else { &new_path };
                        let recreate_dst = &link_path;
                        let _ = if item.is_file {
                            std::os::windows::fs::symlink_file(recreate_src, recreate_dst)
                        } else {
                            std::os::windows::fs::symlink_dir(recreate_src, recreate_dst)
                        };
                    }
                    results.push(UndoResult {
                        old: item.old.clone(),
                        new: item.new.clone(),
                        success: false,
                        error: Some(format!("无法移回文件: {}", e)),
                    });
                }
            }
        } else {
            // === 复制撤销 ===
            // Step 1: 删除复制的文件
            match remove_path(&new_path, item.is_file) {
                Ok(_) => {
                    // Step 2: 删除成功后删除软链接
                    if let Err(e) = remove_symlink(&link_path) {
                        results.push(UndoResult {
                            old: item.old.clone(),
                            new: item.new.clone(),
                            success: false,
                            error: Some(format!("副本已删除但删除软链接失败: {}", e)),
                        });
                    } else {
                        results.push(UndoResult {
                            old: item.old.clone(),
                            new: item.new.clone(),
                            success: true,
                            error: None,
                        });
                    }
                }
                Err(e) => {
                    results.push(UndoResult {
                        old: item.old.clone(),
                        new: item.new.clone(),
                        success: false,
                        error: Some(e),
                    });
                }
            }
        }
    }

    Ok(results)
}
