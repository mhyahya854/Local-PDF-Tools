use crate::types::{EngineAvailabilityResponse, ToolValidationResponse};
use crate::engine_registry;

#[tauri::command]
pub fn list_supported_engines() -> Vec<EngineAvailabilityResponse> {
    engine_registry::list_registered_engines()
        .into_iter()
        .map(|e| EngineAvailabilityResponse::new(
            e.key,
            e.label,
            e.available,
            &e.notes,
            e.supports_batch,
            e.supports_password_protected_files,
            e.supports_ocr,
            e.requires_external_binary,
        ))
        .collect()
}

#[tauri::command]
pub fn validate_files(tool_id: String, file_names: Vec<String>) -> ToolValidationResponse {
    let mut issues = Vec::new();

    if file_names.is_empty() {
        issues.push("No input files were provided.".to_string());
    }

    if tool_id.trim().is_empty() {
        issues.push("Tool id is missing.".to_string());
    }

    ToolValidationResponse {
        ok: issues.is_empty(),
        issues,
    }
}

#[tauri::command]
pub fn cleanup_tmp(max_age_seconds: Option<u64>) -> Result<(), String> {
    use crate::workspace;

    let age = max_age_seconds.unwrap_or(60 * 60 * 24 * 7); // default 7 days
    workspace::cleanup_stale_tmp(age).map_err(|e| format!("cleanup failed: {}", e))
}

#[tauri::command]
pub fn list_persisted_jobs() -> Result<Vec<crate::types::JobRecordResponse>, String> {
    use crate::workspace;
    use std::fs;

    let mut out: Vec<crate::types::JobRecordResponse> = Vec::new();
    let jobs_dir = workspace::workspace_root().join("state").join("jobs");

    if !jobs_dir.exists() {
        return Ok(out);
    }

    let entries = fs::read_dir(&jobs_dir).map_err(|e| format!("failed to read jobs dir: {}", e))?;
    for entry in entries.flatten() {
        if let Ok(meta) = entry.metadata() {
            if !meta.is_file() {
                continue;
            }
        }

        if let Ok(bytes) = fs::read(entry.path()) {
            if let Ok(val) = serde_json::from_slice::<serde_json::Value>(&bytes) {
                // map known fields
                let id = val.get("id").and_then(|v| v.as_str()).unwrap_or_else(|| {
                    entry.path().file_stem().and_then(|s| s.to_str()).unwrap_or("unknown")
                }).to_string();

                let tool_id = val.get("toolId").and_then(|v| v.as_str()).unwrap_or("").to_string();
                let input_files = val.get("inputFiles").and_then(|v| v.as_array()).map(|arr| arr.iter().filter_map(|v| v.as_str().map(|s| s.to_string())).collect()).unwrap_or_else(Vec::new);

                let (output_files, ok, err) = if let Some(result) = val.get("result") {
                    let out_paths = result.get("output_paths").and_then(|v| v.as_array()).map(|arr| arr.iter().filter_map(|v| v.as_str().map(|s| s.to_string())).collect()).unwrap_or_else(Vec::new);
                    let ok = result.get("ok").and_then(|v| v.as_bool()).unwrap_or(false);
                    let err = result.get("error").and_then(|v| v.as_str()).map(|s| s.to_string());
                    (out_paths, ok, err)
                } else {
                    (Vec::new(), false, None)
                };

                let status = if ok { "completed" } else { "failed" };
                let progress = if ok { 100 } else { 0 };

                let updated_at = val.get("updatedAt").and_then(|v| v.as_str()).map(|s| s.to_string()).unwrap_or_else(|| chrono::Utc::now().to_rfc3339());

                let created_at = val.get("createdAt").and_then(|v| v.as_str()).map(|s| s.to_string()).unwrap_or_else(|| updated_at.clone());

                out.push(crate::types::JobRecordResponse {
                    id,
                    tool_id: tool_id.clone(),
                    tool_name: tool_id.clone(),
                    status: status.to_string(),
                    progress,
                    input_files,
                    output_files: output_files,
                    options: serde_json::json!({}),
                    created_at,
                    updated_at,
                    error: err,
                });
            }
        }
    }

    Ok(out)
}
