// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod copy_move_file;
mod create_file_link;
use copy_move_file::move_or_copy_files;
use create_file_link::create_link_auto;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            move_or_copy_files,
            create_link_auto
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
