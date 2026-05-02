//! Voice subsystem commands.
//!
//! Uses the `jarvis-transcriber` Rust crate directly (no Python bridge).
//! Wake-word detection is handled on the TypeScript frontend; this module
//! is responsible only for starting/stopping transcription and emitting
//! the transcript back to the frontend via Tauri events.

use crossbeam_channel::{unbounded, Sender};
use jarvis_transcriber::core::config::Config;
use jarvis_transcriber::transcription::engine::{worker_thread, Command};
use serde::Serialize;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Condvar, Mutex};
use std::thread;
use tauri::{AppHandle, Emitter, State};

// ── Constants ────────────────────────────────────────────────────────

const DEFAULT_MODEL_URI: &str = "https://blob.handy.computer/parakeet-v3-int8.tar.gz";
const DEFAULT_MODEL_PATH: &str = "parakeet-tdt-0.6b-v3-int8";

// ── Event payloads ───────────────────────────────────────────────────

/// Payload emitted to the frontend when a transcription completes.
#[derive(Clone, Serialize)]
pub struct TranscriptPayload {
    pub transcript: String,
}

// ── Managed state ────────────────────────────────────────────────────

/// Shared state for the voice transcription subsystem.
///
/// Created once during app setup and managed by Tauri.
pub struct VoiceState {
    command_tx: Sender<Command>,
    is_transcribing: Arc<AtomicBool>,
    latest_transcript: Arc<Mutex<String>>,
    completion_notifier: Arc<(Mutex<bool>, Condvar)>,
}

impl VoiceState {
    /// Initialise the voice subsystem, spawning the background worker thread.
    pub fn new() -> Result<Self, String> {
        let (command_tx, command_rx) = unbounded();
        let is_transcribing = Arc::new(AtomicBool::new(false));
        let latest_transcript = Arc::new(Mutex::new(String::new()));
        let completion_notifier = Arc::new((Mutex::new(false), Condvar::new()));
        let on_complete_callback = Arc::new(Mutex::new(None)); // unused – we poll instead

        let config = Config::default();

        // Clones for the worker thread
        let is_tx_clone = is_transcribing.clone();
        let lt_clone = latest_transcript.clone();
        let cn_clone = completion_notifier.clone();
        let cb_clone = on_complete_callback;

        thread::spawn(move || {
            worker_thread(
                command_rx,
                is_tx_clone,
                lt_clone,
                cn_clone,
                cb_clone,
                config,
                DEFAULT_MODEL_URI.to_string(),
                DEFAULT_MODEL_PATH.to_string(),
            );
        });

        Ok(Self {
            command_tx,
            is_transcribing,
            latest_transcript,
            completion_notifier,
        })
    }
}

// ── Tauri commands ───────────────────────────────────────────────────

/// Start a transcription session.
///
/// Sends a `Start` command to the background worker and spawns a watcher
/// thread that blocks on the completion condvar, then emits a
/// `voice-transcript-received` Tauri event with the transcript payload.
#[tauri::command]
pub async fn start_voice_listener(
    app: AppHandle,
    state: State<'_, VoiceState>,
) -> Result<bool, String> {
    // Reset the completion flag before starting
    {
        let (lock, _) = &*state.completion_notifier;
        let mut completed = lock.lock().map_err(|e| e.to_string())?;
        *completed = false;
    }

    state
        .command_tx
        .send(Command::Start)
        .map_err(|e| format!("Failed to send start command: {e}"))?;

    // Spawn a lightweight thread to wait for the transcription to finish
    // and then emit the result as a Tauri event.
    let notifier = state.completion_notifier.clone();
    let transcript = state.latest_transcript.clone();

    thread::spawn(move || {
        // Block until the worker signals completion
        let (lock, cvar) = &*notifier;
        let mut completed = lock.lock().unwrap();
        while !*completed {
            completed = cvar.wait(completed).unwrap();
        }

        // Read the transcript and emit the event
        let text = transcript.lock().unwrap().clone();
        let _ = app.emit(
            "voice-transcript-received",
            TranscriptPayload { transcript: text },
        );
    });

    Ok(true)
}

/// Stop the current transcription session early.
#[tauri::command]
pub async fn stop_voice_listener(state: State<'_, VoiceState>) -> Result<bool, String> {
    state
        .command_tx
        .send(Command::Stop)
        .map_err(|e| format!("Failed to send stop command: {e}"))?;
    Ok(true)
}

/// Check whether a transcription is currently in progress.
#[tauri::command]
pub async fn get_voice_status(state: State<'_, VoiceState>) -> Result<bool, String> {
    Ok(state.is_transcribing.load(Ordering::SeqCst))
}
