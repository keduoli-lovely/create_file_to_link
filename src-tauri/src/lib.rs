pub mod check_file_disk;
mod copy_move_file;
mod create_file_link;
mod undo_operation;
use check_file_disk::fs_utils::{file_or_dir, get_total_size, is_symlink};
use copy_move_file::run_check_copy_move_files;
use create_file_link::create_link_auto;
use undo_operation::undo_operation;
use std::sync::Mutex;
use tauri::Manager;

pub struct LockState {
    pub locked_files: Mutex<Vec<std::fs::File>>,
}

impl LockState {
    pub fn new() -> Self {
        Self {
            locked_files: Mutex::new(Vec::new()),
        }
    }
}

/// ponytail: 突破 UIPI — 允许非提权 Explorer 拖放文件到管理员窗口
#[cfg(target_os = "windows")]
fn allow_drag_from_explorer(window: &tauri::WebviewWindow) {
    use windows::Win32::UI::WindowsAndMessaging::{
        ChangeWindowMessageFilterEx, MSGFLT_ALLOW,
        WM_DROPFILES, WM_COPYDATA,
        GetWindow, GW_CHILD, GW_HWNDNEXT,
    };
    use windows::Win32::Foundation::HWND;

    if let Ok(tauri_hwnd) = window.hwnd() {
        let hwnd = HWND(tauri_hwnd.0);

        unsafe {
            // 主窗口
            let _ = ChangeWindowMessageFilterEx(hwnd, WM_DROPFILES, MSGFLT_ALLOW, None);
            let _ = ChangeWindowMessageFilterEx(hwnd, WM_COPYDATA, MSGFLT_ALLOW, None);

            // 子窗口链（WebView2 等）
            let mut child = GetWindow(hwnd, GW_CHILD).ok();
            while let Some(h) = child {
                if h.0.is_null() { break; }
                let _ = ChangeWindowMessageFilterEx(h, WM_DROPFILES, MSGFLT_ALLOW, None);
                let _ = ChangeWindowMessageFilterEx(h, WM_COPYDATA, MSGFLT_ALLOW, None);
                child = GetWindow(h, GW_HWNDNEXT).ok();
            }
        }
    }
}

#[tauri::command]
fn open_devtools(window: tauri::Window) {
    if let Some(win) = window.get_webview_window("main") {
        if !win.is_devtools_open() {
            win.open_devtools();
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            app.manage(LockState::new());

            if let Some(win) = app.get_webview_window("main") {
                // 关闭应用内右键菜单
                win.eval(
                    r#"
                        window.addEventListener("contextmenu", (e) => e.preventDefault());
                    "#,
                )
                .expect("contextmenu block error");

                // UIPI 绕过：允许 Explorer 拖放到管理员窗口
                #[cfg(target_os = "windows")]
                allow_drag_from_explorer(&win);
            }
            Ok(())
        })
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            run_check_copy_move_files,
            create_link_auto,
            is_symlink,
            open_devtools,
            file_or_dir,
            get_total_size,
            undo_operation,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
