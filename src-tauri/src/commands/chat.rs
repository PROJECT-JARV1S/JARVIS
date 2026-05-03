use crate::domain::chat::{ChatResponse, ChatState};
use crate::domain::errors::AppError;
use crate::handlers::chat::{get_providers, send_prompt, set_provider};
use tauri::State;

/// Send a prompt to jarvis-chat via PyO3.
#[tauri::command]
pub async fn prompt(input: String, state: State<'_, ChatState>) -> Result<ChatResponse, AppError> {
    let provider = state
        .active_provider
        .lock()
        .map_err(|e| AppError::LockError(e.to_string()))?
        .clone();

    let response = send_prompt(&input, &provider)?;

    Ok(ChatResponse {
        message: response,
        provider,
    })
}

/// Get available LLM providers from jarvis-chat.
#[tauri::command]
pub async fn get_chat_providers() -> Result<Vec<String>, AppError> {
    get_providers()
}

/// Set the active LLM provider.
#[tauri::command]
pub async fn set_chat_provider(
    provider: String,
    state: State<'_, ChatState>,
) -> Result<(), AppError> {
    set_provider(&state, provider)
}
