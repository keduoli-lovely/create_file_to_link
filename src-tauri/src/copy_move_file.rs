use crate::check_file_disk::index::file_and_disk_ok;
use fs_extra::dir::{
    copy_with_progress as copy_dir_with_progress, move_dir_with_progress,
    CopyOptions as DirCopyOptions, TransitProcess as DirTransit, TransitProcessResult,
};
use fs_extra::file::{
    copy_with_progress, move_file_with_progress, CopyOptions as FileCopyOptions,
    TransitProcess as FileTransit,
};
use serde::Serialize;
use std::path::PathBuf;
use tauri::{command, AppHandle, Emitter};

#[derive(Serialize, Clone)]
pub struct FileResult {
    pub old: String,
    pub new: String,
    pub success: bool,
}

#[derive(Serialize, Clone, Debug)]
pub struct ProgressPayload {
    pub src: String,
    pub percent: u64,
}

#[command]
pub fn run_check_copy_move_files(
    app: AppHandle,
    go_list: Vec<String>,
    is_file: bool,
    is_copy: bool,
    to_path: String,
) -> Result<(), String> {
    // 后台线程
    std::thread::spawn(move || {
        match file_and_disk_ok(go_list.clone(), to_path.clone()) {
            Ok(_) => {
                let result = copy_move_files(app.clone(), go_list, is_file, is_copy, to_path);
                match result {
                    Ok(list) => {
                        let _ = app.emit("file-complete", list);
                    }
                    Err(err) => {
                        let _ = app.emit("file-error", err);
                    }
                }
            }
            Err(e) => {
                let _ = app.emit("check_move_file_error", e);
                return;
            }
        }
    });

    Ok(())
}

/// 回滚已移动的文件（剪切失败时）：将 new 移回 old
fn rollback_moved(successful: &[(String, String)]) {
    for (old, new) in successful.iter().rev() {
        let old_path = PathBuf::from(old);
        let new_path = PathBuf::from(new);
        if new_path.exists() {
            if new_path.is_file() {
                let _ = std::fs::rename(&new_path, &old_path);
            } else if new_path.is_dir() {
                // 确保 old 的父目录存在
                if let Some(parent) = old_path.parent() {
                    let _ = std::fs::create_dir_all(parent);
                }
                let _ = std::fs::rename(&new_path, &old_path);
            }
        }
    }
}

/// 回滚已复制的文件（复制失败时）：删除 new
fn rollback_copied(successful: &[(String, String)]) {
    for (_, new) in successful.iter().rev() {
        let new_path = PathBuf::from(new);
        if new_path.exists() {
            if new_path.is_file() {
                let _ = std::fs::remove_file(&new_path);
            } else if new_path.is_dir() {
                let _ = std::fs::remove_dir_all(&new_path);
            }
        }
    }
}

//  执行复制/移动的函数
fn copy_move_files(
    app: AppHandle,
    go_list: Vec<String>,
    is_file: bool,
    is_copy: bool,
    to_path: String,
) -> Result<Vec<FileResult>, String> {
    let mut results = Vec::new();
    // 记录已成功处理的 (old, new) 对，用于失败时回滚
    let mut successful: Vec<(String, String)> = Vec::new();

    // 确保目标目录存在
    std::fs::create_dir_all(&to_path).map_err(|e| format!("创建目标目录失败: {}", e))?;

    for src in go_list {
        let src_path = PathBuf::from(&src);
        let file_name = src_path
            .file_name()
            .ok_or_else(|| format!("无法获取文件名: {}", src))?;
        let dest_path = PathBuf::from(&to_path).join(file_name);
        let src_clone = src.clone();
        let app_clone = app.clone();

        if is_file {
            // 文件操作
            let mut options = FileCopyOptions::new();
            options.overwrite = true;
            let mut last_percent = 0;

            let handler = move |info: FileTransit| {
                let percent = if info.total_bytes > 0 {
                    info.copied_bytes * 100 / info.total_bytes
                } else {
                    0
                };

                // 只在百分比变化 emit
                if percent != last_percent {
                    let _ = app_clone.emit(
                        "file-progress",
                        ProgressPayload {
                            src: src_clone.clone(),
                            percent,
                        },
                    );
                    last_percent = percent;
                }
            };

            let op_result = if is_copy {
                copy_with_progress(&src_path, &dest_path, &options, handler)
            } else {
                move_file_with_progress(&src_path, &dest_path, &options, handler)
            };

            match op_result {
                Ok(_) => {
                    successful.push((src.clone(), dest_path.to_string_lossy().to_string()));
                    results.push(FileResult {
                        old: src.clone(),
                        new: dest_path.to_string_lossy().to_string(),
                        success: true,
                    });
                }
                Err(e) => {
                    let _ = app.emit(
                        "file-move-err",
                        ("操作失败", src.clone(), e.to_string()),
                    );
                    // 回滚已成功的文件
                    if is_copy {
                        rollback_copied(&successful);
                    } else {
                        rollback_moved(&successful);
                    }
                    return Err(format!(
                        "文件操作失败: {}，已回滚 {} 个文件",
                        src,
                        successful.len()
                    ));
                }
            }
        } else {
            // 目录操作
            let mut options = DirCopyOptions::new();
            options.overwrite = true;
            let mut last_percent = 0;

            let handler = move |info: DirTransit| {
                let percent = if info.total_bytes > 0 {
                    info.copied_bytes * 100 / info.total_bytes
                } else {
                    0
                };
                let _ = app_clone.clone();
                if percent != last_percent {
                    let _ = app_clone.emit(
                        "file-progress",
                        ProgressPayload {
                            src: src_clone.clone(),
                            percent,
                        },
                    );
                    last_percent = percent;
                }
                TransitProcessResult::ContinueOrAbort
            };

            let op_result = if is_copy {
                copy_dir_with_progress(&src_path, &PathBuf::from(&to_path), &options, handler)
            } else {
                move_dir_with_progress(&src_path, &PathBuf::from(&to_path), &options, handler)
            };

            match op_result {
                Ok(_) => {
                    let dest = PathBuf::from(&to_path)
                        .join(src_path.file_name().unwrap());
                    successful.push((src.clone(), dest.to_string_lossy().to_string()));
                    results.push(FileResult {
                        old: src.clone(),
                        new: dest.to_string_lossy().to_string(),
                        success: true,
                    });
                }
                Err(e) => {
                    let _ = app.emit(
                        "file-move-err",
                        ("操作失败", src.clone(), e.to_string()),
                    );
                    // 回滚已成功的文件
                    if is_copy {
                        rollback_copied(&successful);
                    } else {
                        rollback_moved(&successful);
                    }
                    return Err(format!(
                        "目录操作失败: {}，已回滚 {} 个目录",
                        src,
                        successful.len()
                    ));
                }
            }
        }
    }

    Ok(results)
}
