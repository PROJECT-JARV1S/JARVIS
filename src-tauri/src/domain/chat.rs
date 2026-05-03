use serde::Serialize;
use std::sync::Mutex;

/// Managed state for the chat subsystem.
#[derive(Default)]
pub struct ChatState {
    /// Currently selected LLM provider name.
    pub active_provider: Mutex<String>,
}

#[derive(Serialize)]
pub struct ChatResponse {
    pub message: String,
    pub provider: String,
}
