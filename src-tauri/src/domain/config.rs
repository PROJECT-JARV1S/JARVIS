use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub vad_threshold: f32,
    pub silence_threshold_rms: f32,
    pub silence_duration_ms: u64,
    pub api_key: String,
    pub chat_model: String,
    pub chat_base_url: String,
    pub mcp_config_path: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            vad_threshold: 0.5,
            silence_threshold_rms: 0.01,
            silence_duration_ms: 1000,
            api_key: "".to_string(),
            chat_model: "google/gemma-4-e4b".to_string(),
            chat_base_url: "http://127.0.0.1:1234/v1".to_string(),
            mcp_config_path: "mcp.json".to_string(),
        }
    }
}

impl AppConfig {
    pub fn load_from(path: &Path) -> Result<Self, anyhow::Error> {
        if !path.exists() {
            let default_config = Self::default();
            default_config.save_to(path)?;
            return Ok(default_config);
        }
        let content = fs::read_to_string(path)?;
        let config: Self = toml::from_str(&content)?;
        Ok(config)
    }

    pub fn save_to(&self, path: &Path) -> Result<(), anyhow::Error> {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }
        let content = toml::to_string(self)?;
        fs::write(path, content)?;
        Ok(())
    }
}
