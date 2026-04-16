use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineAvailabilityResponse {
    pub key: String,
    pub label: String,
    pub available: bool,
    pub notes: String,
}

impl EngineAvailabilityResponse {
    pub fn new(key: &str, label: &str, available: bool, notes: &str) -> Self {
        Self {
            key: key.to_string(),
            label: label.to_string(),
            available,
            notes: notes.to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolExecutionRequest {
    pub job_id: String,
    pub tool_id: String,
    pub file_names: Vec<String>,
    pub options: serde_json::Value,
    pub output_extension: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolExecutionResult {
    pub ok: bool,
    pub output_paths: Vec<String>,
    pub error: Option<String>,
    pub warning: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolValidationResponse {
    pub ok: bool,
    pub issues: Vec<String>,
}
