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

use serde::Serialize;

#[derive(Serialize)]
pub struct SkillResult {
    pub skill_name: String,
    pub success: bool,
    pub message: String,
}

/// Placeholder: query device info from jarvis-skills MCP.
#[tauri::command]
pub async fn get_device_info() -> Result<String, String> {
    Err("jarvis-skills module not yet available".into())
}

/// Placeholder: list available skills from the MCP server.
#[tauri::command]
pub async fn list_skills() -> Result<Vec<String>, String> {
    Err("jarvis-skills module not yet available".into())
}
