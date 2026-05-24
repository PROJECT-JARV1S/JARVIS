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

/// Queries system/device information from the `jarvis-skills` MCP server.
///
/// # Returns
///
/// Returns a JSON-formatted string containing system details on success,
/// or an [`AppError`] on failure.
#[tauri::command]
pub async fn get_device_info() -> Result<String, AppError> {
    crate::handlers::skills::get_device_info()
}

/// Retrieves the list of available system integration capabilities (skills) from the MCP server.
///
/// # Returns
///
/// Returns a list of capability names on success, or an [`AppError`] on failure.
#[tauri::command]
pub async fn list_skills() -> Result<Vec<String>, AppError> {
    crate::handlers::skills::list_skills()
}

