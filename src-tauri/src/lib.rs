pub mod commands;
pub mod domain;
pub mod handlers;

use tauri::Manager;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(domain::chat::ChatState::default())
        .setup(|app| {
            // Initialize Python interpreter for jarvis-chat
            pyo3::Python::initialize();

            // Initialise the voice transcription worker (pure Rust, no Python)
            let voice_state =
                handlers::voice::init_voice_state().expect("failed to initialise voice subsystem");
            app.manage(voice_state);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Chat (jarvis-chat via PyO3)
            commands::chat::prompt,
            commands::chat::get_chat_providers,
            commands::chat::set_chat_provider,
            // Voice (jarvis-transcriber, pure Rust)
            commands::voice::start_voice_listener,
            commands::voice::stop_voice_listener,
            commands::voice::get_voice_status,
            // Skills (jarvis-skills MCP — stubs)
            commands::skills::get_device_info,
            commands::skills::list_skills,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
