//! Voice subsystem commands.
//!
//! Uses the `jarvis-transcriber` Rust crate directly (no Python bridge).
//! Wake-word detection is handled on the TypeScript frontend; this module
//! is responsible only for starting/stopping transcription and emitting
//! the transcript back to the frontend via Tauri events.

use crate::domain::errors::AppError;
use crate::domain::voice::VoiceState;
use crate::handlers::voice::{get_status, start_transcription, stop_transcription};
use tauri::{AppHandle, State};

/// Start a transcription session.
///
/// Sends a `Start` command to the background worker and spawns a watcher
/// thread that blocks on the completion condvar, then emits a
/// `voice-transcript-received` Tauri event with the transcript payload.
#[tauri::command]
pub async fn start_voice_listener(
    app: AppHandle,
    state: State<'_, VoiceState>,
) -> Result<bool, AppError> {
    start_transcription(&state, app)?;
    Ok(true)
}

/// Stop the current transcription session early.
#[tauri::command]
pub async fn stop_voice_listener(state: State<'_, VoiceState>) -> Result<bool, AppError> {
    stop_transcription(&state)?;
    Ok(true)
}

/// Check whether a transcription is currently in progress.
#[tauri::command]
pub async fn get_voice_status(state: State<'_, VoiceState>) -> Result<bool, AppError> {
    Ok(get_status(&state))
}
