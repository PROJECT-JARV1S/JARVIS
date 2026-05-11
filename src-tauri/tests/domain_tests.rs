use jarvis_lib::domain::config::AppConfig;
use jarvis_lib::domain::db::DatabaseManager;
use rig::message::Message;
use std::fs;

#[test]
fn test_config_serialization() {
    let config = AppConfig::default();
    let toml_str = toml::to_string(&config).unwrap();
    let deserialized: AppConfig = toml::from_str(&toml_str).unwrap();
    assert_eq!(config.chat_model, deserialized.chat_model);
}

#[test]
fn test_config_load_save() {
    let temp_dir = std::env::temp_dir();
    let config_path = temp_dir.join("jarvis_test_config.toml");

    let default_config = AppConfig::default();
    default_config.save_to(&config_path).unwrap();

    let loaded = AppConfig::load_from(&config_path).unwrap();
    assert_eq!(default_config.vad_threshold, loaded.vad_threshold);

    // cleanup
    let _ = fs::remove_file(config_path);
}

#[test]
fn test_database_manager() {
    let temp_dir = std::env::temp_dir();
    let db_path = temp_dir.join("jarvis_test.db");

    // Clean up before test just in case
    let _ = fs::remove_file(&db_path);

    let db = DatabaseManager::new(&db_path).unwrap();
    let session_id = db.create_session(Some("Test Session".to_string())).unwrap();

    // The initial history should be empty
    let initial_history = db.get_session_history(&session_id).unwrap();
    assert!(initial_history.is_empty());

    // We can't easily construct rig::message::Message here if its fields are private
    // or without importing more from rig, but we can verify it doesn't crash on an empty load.

    // Get all sessions
    let sessions = db.get_all_sessions().unwrap();
    assert_eq!(sessions.len(), 1);
    assert_eq!(sessions[0].title, Some("Test Session".to_string()));

    // Clean up
    let _ = fs::remove_file(db_path);
}
