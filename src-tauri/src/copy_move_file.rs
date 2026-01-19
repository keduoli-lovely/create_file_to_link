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
    std::thread::spawn(
        move || match file_and_disk_ok(go_list.clone(), to_path.clone()) {
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
        },
    );

    Ok(())
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

            if is_copy {
                if let Err(e) = copy_with_progress(&src_path, &dest_path, &options, handler) {
                    let _ = app.emit("file-move-err", ("拷贝失败", src.clone(), e.to_string()));
                }
            } else {
                if let Err(e) = move_file_with_progress(&src_path, &dest_path, &options, handler) {
                    let _ = app.emit("file-move-err", ("拷贝失败", src.clone(), e.to_string()));
                }
            }

            results.push(FileResult {
                old: src.clone(),
                new: dest_path.to_string_lossy().to_string(),
            });
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

            if is_copy {
                if let Err(e) =
                    copy_dir_with_progress(&src_path, &PathBuf::from(&to_path), &options, handler)
                {
                    let _ = app.emit("file-move-err", ("拷贝失败", src.clone(), e.to_string()));
                }
            } else {
                if let Err(e) =
                    move_dir_with_progress(&src_path, &PathBuf::from(&to_path), &options, handler)
                {
                    let _ = app.emit("file-move-err", ("拷贝失败", src.clone(), e.to_string()));
                }
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
