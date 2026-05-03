use crossbeam_channel::Sender;
use jarvis_transcriber::transcription::engine::Command;
use serde::Serialize;
use std::sync::atomic::AtomicBool;
use std::sync::{Arc, Condvar, Mutex};

pub const DEFAULT_MODEL_URI: &str = "https://blob.handy.computer/parakeet-v3-int8.tar.gz";
pub const DEFAULT_MODEL_PATH: &str = "parakeet-tdt-0.6b-v3-int8";

/// Payload emitted to the frontend when a transcription completes.
#[derive(Clone, Serialize)]
pub struct TranscriptPayload {
    pub transcript: String,
}

/// Shared state for the voice transcription subsystem.
///
/// Created once during app setup and managed by Tauri.
pub struct VoiceState {
    pub command_tx: Sender<Command>,
    pub is_transcribing: Arc<AtomicBool>,
    pub latest_transcript: Arc<Mutex<String>>,
    pub completion_notifier: Arc<(Mutex<bool>, Condvar)>,
}
