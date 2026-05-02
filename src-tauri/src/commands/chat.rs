use pyo3::prelude::*;
use pyo3::types::PyList;
use serde::Serialize;
use std::sync::Mutex;
use tauri::State;

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

/// Send a prompt to jarvis-chat via PyO3.
#[tauri::command]
pub async fn prompt(input: String, state: State<'_, ChatState>) -> Result<ChatResponse, String> {
    let provider = state
        .active_provider
        .lock()
        .map_err(|e| e.to_string())?
        .clone();

    let response = Python::attach(|py| -> PyResult<String> {
        let bridge = PyModule::import(py, "chat_bridge")?;
        let result = bridge.call_method1("send_prompt", (&input, &provider))?;
        result.extract::<String>()
    })
    .map_err(|e| format!("Python error: {e}"))?;

    Ok(ChatResponse {
        message: response,
        provider,
    })
}

/// Get available LLM providers from jarvis-chat.
#[tauri::command]
pub async fn get_chat_providers() -> Result<Vec<String>, String> {
    Python::attach(|py| -> PyResult<Vec<String>> {
        let bridge = PyModule::import(py, "chat_bridge")?;
        let result = bridge.call_method0("get_available_providers")?;
        let py_list: &Bound<'_, PyList> = result.cast()?;
        py_list
            .iter()
            .map(|item: Bound<'_, pyo3::PyAny>| item.extract::<String>())
            .collect()
    })
    .map_err(|e| format!("Python error: {e}"))
}

/// Set the active LLM provider.
#[tauri::command]
pub async fn set_chat_provider(
    provider: String,
    state: State<'_, ChatState>,
) -> Result<(), String> {
    let mut active = state.active_provider.lock().map_err(|e| e.to_string())?;
    *active = provider;
    Ok(())
}
