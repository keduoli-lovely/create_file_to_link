use crate::check_file_look_file::check_file_look_file;
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
}

#[derive(Serialize, Clone)]
pub struct ProgressPayload {
    pub src: String,
    pub percent: u64,
}

#[command]
pub fn move_or_copy_files(
    app: AppHandle,
    go_list: Vec<String>,
    is_file: bool,
    is_copy: bool,
    to_path: String,
) -> Result<(), String> {
    let app_clone = app.clone();
    let go_list_clone = go_list.clone();
    // 后台线程
    std::thread::spawn(move || {
        match check_file_look_file(app_clone.clone(), go_list_clone.clone()) {
            Ok(_) => {
                // 扫描完成 → 启动线程 B
                let app2 = app_clone.clone();
                std::thread::spawn(move || {
                    let result =
                        do_copy_job(app2.clone(), go_list_clone, is_file, is_copy, to_path);
                    match result {
                        Ok(list) => {
                            let _ = app2.emit("file-complete", list);
                        }
                        Err(err) => {
                            let _ = app2.emit("file-error", err);
                        }
                    }
                });
            }
            Err(_) => {
                let _ = app_clone.emit("lock_error", "lock_failed");
            }
        }
    });

    Ok(())
}

//  执行复制/移动的函数
fn do_copy_job(
    app: AppHandle,
    go_list: Vec<String>,
    is_file: bool,
    is_copy: bool,
    to_path: String,
) -> Result<Vec<FileResult>, String> {
    let mut results = Vec::new();

    // 确保目标目录存在
    std::fs::create_dir_all(&to_path).map_err(|e| format!("创建目标目录失败: {}", e))?;

    for src in go_list {
        let src_path = PathBuf::from(&src);
        let file_name = src_path
            .file_name()
            .ok_or_else(|| format!("无法获取文件名: {}", src))?;
        let dest_path = PathBuf::from(&to_path).join(file_name);

        if is_file {
            // -------------------------
            // 文件操作
            // -------------------------
            let mut options = FileCopyOptions::new();
            options.overwrite = true;

            let app = app.clone();
            let src_clone = src.clone();

            let handler = move |info: FileTransit| {
                let percent = if info.total_bytes > 0 {
                    info.copied_bytes * 100 / info.total_bytes
                } else {
                    0
                };

                let _ = app.emit(
                    "file-progress",
                    ProgressPayload {
                        src: src_clone.clone(),
                        percent,
                    },
                );

                if info.copied_bytes % (4 * 1024 * 1024) == 0 {
                    std::thread::sleep(std::time::Duration::from_micros(500));
                }
            };

            if is_copy {
                copy_with_progress(&src_path, &dest_path, &options, handler)
                    .map_err(|e| format!("拷贝失败 {}: {}", src, e))?;
            } else {
                move_file_with_progress(&src_path, &dest_path, &options, handler)
                    .map_err(|e| format!("移动失败 {}: {}", src, e))?;
            }

            results.push(FileResult {
                old: src.clone(),
                new: dest_path.to_string_lossy().to_string(),
            });
        } else {
            // -------------------------
            // 目录操作
            // -------------------------
            let mut options = DirCopyOptions::new();
            options.overwrite = true;

            let app = app.clone();
            let src_clone = src.clone();

            let handler = move |info: DirTransit| {
                let percent = if info.total_bytes > 0 {
                    info.copied_bytes * 100 / info.total_bytes
                } else {
                    0
                };

                let _ = app.emit(
                    "file-progress",
                    ProgressPayload {
                        src: src_clone.clone(),
                        percent,
                    },
                );

                if info.copied_bytes % (4 * 1024 * 1024) == 0 {
                    std::thread::sleep(std::time::Duration::from_micros(500));
                }

                TransitProcessResult::ContinueOrAbort
            };

            if is_copy {
                copy_dir_with_progress(&src_path, &PathBuf::from(&to_path), &options, handler)
                    .map_err(|e| format!("目录拷贝失败 {}: {}", src, e))?;
            } else {
                move_dir_with_progress(&src_path, &PathBuf::from(&to_path), &options, handler)
                    .map_err(|e| format!("目录移动失败 {}: {}", src, e))?;
            }

            results.push(FileResult {
                old: src.clone(),
                new: PathBuf::from(&to_path)
                    .join(src_path.file_name().unwrap())
                    .to_string_lossy()
                    .to_string(),
            });
        }
    }

    Ok(results)
}
