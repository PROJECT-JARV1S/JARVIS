//! Stub module for jarvis-skills (MCP server) integration.
//!
//! This module will provide:
//! - Device information (CPU, RAM, Storage, Network) via jarvis-skills MCP
//! - Hardware control (volume, Bluetooth, Wi-Fi) via jarvis-skills MCP
//! - Spotify playback via Spotify MCP
//! - Screen recording via obs-cmd
//! - File organization (scoped directory access)
//! - Screen text translation
//!
//! TODO: Implement once jarvis-skills module is finalized.

use crate::domain::errors::AppError;

/// Placeholder: query device info from jarvis-skills MCP.
#[tauri::command]
pub async fn get_device_info() -> Result<String, AppError> {
    crate::handlers::skills::get_device_info()
}

/// Placeholder: list available skills from the MCP server.
#[tauri::command]
pub async fn list_skills() -> Result<Vec<String>, AppError> {
    crate::handlers::skills::list_skills()
}
