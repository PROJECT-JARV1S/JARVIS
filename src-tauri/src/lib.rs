pub mod commands;
pub mod domain;
pub mod handlers;

use crate::commands::chat::*;
use crate::commands::skills::*;
use crate::commands::voice::*;
use tauri::Manager;
// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(domain::chat::ChatState::default())
        .setup(|app| {
            // Initialize Python interpreter for jarvis-chat/voice
            pyo3::Python::initialize();

            // Load Configuration
            let config = if let Ok(config_dir) = app.path().app_config_dir() {
                let config_path = config_dir.join("config.toml");
                crate::domain::config::AppConfig::load_from(&config_path).unwrap_or_default()
            } else {
                crate::domain::config::AppConfig::default()
            };

            let vad_threshold = config.vad_threshold;
            let silence_duration_ms = config.silence_duration_ms;
            app.manage(std::sync::Mutex::new(config));

            // Load Database
            if let Ok(data_dir) = app.path().app_data_dir() {
                let db_path = data_dir.join("jarvis.db");
                let db = crate::domain::db::DatabaseManager::new(&db_path)
                    .expect("Failed to initialize database");
                app.manage(db);
            }

            // Initialise the voice transcription worker (pure Rust, no Python)
            let voice_state = handlers::voice::init_voice_state(vad_threshold, silence_duration_ms)
                .expect("failed to initialise voice subsystem");
            app.manage(voice_state);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Chat
            prompt,
            create_session,
            list_sessions,
            get_history,
            get_chat_providers,
            set_chat_provider,
            // Voice (jarvis-transcriber, pure Rust)
            start_voice_listener,
            stop_voice_listener,
            get_voice_status,
            // Skills (jarvis-skills MCP — stubs)
            get_device_info,
            commands::skills::list_skills,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
