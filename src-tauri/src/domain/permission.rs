use serde::{Deserialize, Serialize};

/// A pending permission request sent to the frontend when an agent tool wants to execute.
///
/// The frontend displays a prompt to the user, then calls `respond_to_permission`
/// with the matching `request_id` and a [`PermissionResponse`].
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PermissionRequest {
    /// Unique identifier for this request. UUID v4.
    pub request_id: String,
    /// Name of the tool requesting permission (e.g. `"write_document"`).
    pub tool_name: String,
    /// Human-readable description of what the tool wants to do
    /// (e.g. `"Wants to write file at [/path/to/file.txt]"`).
    pub description: String,
}

/// User's response to a [`PermissionRequest`], dispatched from the frontend.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case", tag = "kind")]
pub enum PermissionResponse {
    /// Allow this single invocation.
    Allow,
    /// Deny this single invocation. `reason` is propagated back to the LLM
    /// as a tool error so it can adjust its plan.
    Deny { reason: String },
    /// Allow this tool for all future invocations (persisted in DB).
    AllowAlways,
    /// Deny this tool for all future invocations (persisted in DB).
    DenyAlways,
}

/// Persisted permission preference for a single tool.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PermissionPreference {
    /// Name of the tool (e.g. `"write_document"`).
    pub tool_name: String,
    /// Persisted decision: `"allow"` or `"deny"`.
    pub decision: String,
}
