// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod copy_move_file;
mod create_file_link;
use copy_move_file::move_or_copy_files;
use create_file_link::{create_link_auto, is_symlink};
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                return Ok(());
            }

            // 关闭应用内右键菜单
            if let Some(win) = app.get_webview_window("main") {
                win.eval(
                    r#"
                        window.addEventListener("contextmenu", (e) => e.preventDefault());
                    "#,
                )
                .expect("menu hiddn error")
            }
            Ok(())
        })
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            move_or_copy_files,
            create_link_auto,
            is_symlink,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
