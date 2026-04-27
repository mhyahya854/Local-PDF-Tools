use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineAvailabilityResponse {
    pub key: String,
    pub label: String,
    pub installed: bool,
    pub implemented: bool,
    pub runnable: bool,
    pub available: bool,
    pub notes: Vec<String>,
    pub supports_batch: bool,
    pub supports_password_protected_files: bool,
    pub supports_ocr: bool,
    pub requires_external_binary: bool,
}

impl EngineAvailabilityResponse {
    pub fn new(
        key: &str,
        label: &str,
        installed: bool,
        implemented: bool,
        notes: &[String],
        supports_batch: bool,
        supports_password_protected_files: bool,
        supports_ocr: bool,
        requires_external_binary: bool,
    ) -> Self {
        let runnable = installed && implemented;
        Self {
            key: key.to_string(),
            label: label.to_string(),
            installed,
            implemented,
            runnable,
            available: runnable,
            notes: notes.to_vec(),
            supports_batch,
            supports_password_protected_files,
            supports_ocr,
            requires_external_binary,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeDiagnosticsResponse {
    pub runtime: String,
    pub invoke_available: bool,
    pub dialog_plugin_expected: bool,
    pub engine_probe_fetched: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolCapabilityResponse {
    pub tool_id: String,
    pub engine_key: String,
    pub implemented: bool,
    pub desktop_only: bool,
    pub browser_preview: bool,
    pub runnable: bool,
    pub input_extensions: Vec<String>,
    pub output_extension: String,
    pub min_files: usize,
    pub max_files: Option<usize>,
    pub supports_batch: bool,
    pub supported_options: Vec<String>,
    pub sensitive_options: Vec<String>,
    pub output_strategy: String,
    pub notes: Vec<String>,
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
    pub warning: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolExecutionInputFile {
    pub name: String,
    pub path: Option<String>,
    pub size_bytes: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolExecutionRequest {
    pub job_id: String,
    pub tool_id: String,
    pub input_files: Vec<ToolExecutionInputFile>,
    pub options: serde_json::Value,
    pub output_extension: String,
    pub output_directory: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolExecutionResult {
    pub ok: bool,
    pub output_paths: Vec<String>,
    pub error: Option<String>,
    pub warning: Option<String>,
}
