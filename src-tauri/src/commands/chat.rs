use crate::domain::chat::ChatResponse;
use crate::domain::config::AppConfig;
use crate::domain::db::{DatabaseManager, Session};
use crate::domain::errors::AppError;
use crate::handlers::chat::{get_providers, send_prompt, set_provider};
use rig::message::Message;
use tauri::State;

/// Create a new session and return the ID
#[tauri::command]
pub async fn create_session(
    title: Option<String>,
    db: State<'_, DatabaseManager>,
) -> Result<String, AppError> {
    db.create_session(title)
        .map_err(|e| AppError::SystemError(e.to_string()))
}

/// Send a prompt to the Rust agent
#[tauri::command]
pub async fn prompt(
    session_id: String,
    input: String,
    config: State<'_, AppConfig>,
    db: State<'_, DatabaseManager>,
) -> Result<ChatResponse, AppError> {
    let provider = config.chat_model.clone();
    let response = send_prompt(&session_id, &input, &config, &db).await?;

    Ok(ChatResponse {
        message: response,
        provider,
    })
}

/// Get available LLM providers
#[tauri::command]
pub async fn get_chat_providers() -> Result<Vec<String>, AppError> {
    get_providers()
}

/// Set the active LLM provider.
#[tauri::command]
pub async fn set_chat_provider(provider: String) -> Result<(), AppError> {
    set_provider(provider)
}

/// List all sessions
#[tauri::command]
pub async fn list_sessions(db: State<'_, DatabaseManager>) -> Result<Vec<Session>, AppError> {
    db.get_all_sessions()
        .map_err(|e| AppError::SystemError(e.to_string()))
}

/// Get history for a session
#[tauri::command]
pub async fn get_history(
    session_id: String,
    db: State<'_, DatabaseManager>,
) -> Result<Vec<Message>, AppError> {
    db.get_session_history(&session_id)
        .map_err(|e| AppError::SystemError(e.to_string()))
}
