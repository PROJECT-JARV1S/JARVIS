use crate::domain::config::AppConfig;
use crate::domain::db::DatabaseManager;
use crate::domain::errors::AppError;
use agent_rs_lib::agent::memory::context::AgentContextExt;
use agent_rs_lib::agent::tools::{ReadDocumentTool, WriteDocumentTool};
use agent_rs_lib::config::McpConfig;
use agent_rs_lib::mcp::client::McpClient;
use rig::prelude::*;
use rig::providers::openai;
use rig::tool::ToolDyn;
use std::path::Path;

pub async fn send_prompt(
    session_id: &str,
    input: &str,
    config: &AppConfig,
    db: &DatabaseManager,
) -> Result<String, AppError> {
    // 1. Get history from DB
    let mut history = db
        .get_session_history(session_id)
        .unwrap_or_else(|_| vec![]);

    // 2. Setup client (using LMStudio defaults if api_key is empty)
    let api_key = if config.api_key.is_empty() {
        "sk-local"
    } else {
        &config.api_key
    };
    let client = openai::Client::builder()
        .base_url(&config.chat_base_url)
        .api_key(api_key)
        .build()
        .map_err(|e| AppError::SystemError(e.to_string()))?;

    // 3. Setup tools
    let mut tools: Vec<Box<dyn ToolDyn>> =
        vec![Box::new(ReadDocumentTool), Box::new(WriteDocumentTool)];

    if Path::new(&config.mcp_config_path).exists() {
        if let Ok(mcp_config) = McpConfig::from_path(&config.mcp_config_path) {
            if let Ok(mcp_client) = McpClient::new(mcp_config).tools().await {
                tools.extend(mcp_client);
            }
        }
    }

    // 4. Build Agent with Auto-Compaction
    let compaction_model = client
        .agent(&config.chat_model)
        .preamble("Summarize this context briefly, capturing key points.")
        .build();

    let agent = client
        .agent(&config.chat_model)
        .tools(tools)
        .preamble("You are JARVIS, a helpful AI assistant.")
        .build()
        .with_compaction(2000, compaction_model);

    // 5. Send Chat
    let response = agent
        .chat(input, &mut history)
        .await
        .map_err(|e| AppError::SystemError(e.to_string()))?;

    // 6. Save history back
    db.save_session_history(session_id, &history)
        .map_err(|e| AppError::SystemError(e.to_string()))?;

    Ok(response)
}

pub fn get_providers() -> Result<Vec<String>, AppError> {
    // Hardcoded for MVP since we use agent_rs_lib directly
    Ok(vec!["openai".to_string(), "local".to_string()])
}

pub fn set_provider(_provider: String) -> Result<(), AppError> {
    Ok(())
}
