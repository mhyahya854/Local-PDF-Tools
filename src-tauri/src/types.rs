use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineAvailabilityResponse {
    pub key: String,
    pub label: String,
    pub available: bool,
    pub notes: String,
    pub supports_batch: bool,
    pub supports_password_protected_files: bool,
    pub supports_ocr: bool,
    pub requires_external_binary: bool,
}

impl EngineAvailabilityResponse {
    pub fn new(
        key: &str,
        label: &str,
        available: bool,
        notes: &str,
        supports_batch: bool,
        supports_password_protected_files: bool,
        supports_ocr: bool,
        requires_external_binary: bool,
    ) -> Self {
        Self {
            key: key.to_string(),
            label: label.to_string(),
            available,
            notes: notes.to_string(),
            supports_batch,
            supports_password_protected_files,
            supports_ocr,
            requires_external_binary,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct JobRecordResponse {
    pub id: String,
    pub tool_id: String,
    pub tool_name: String,
    pub status: String,
    pub progress: u8,
    pub input_files: Vec<String>,
    pub output_files: Vec<String>,
    pub options: serde_json::Value,
    pub created_at: String,
    pub updated_at: String,
    pub error: Option<String>,
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
