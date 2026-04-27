use crate::engine_registry;
use crate::types::{
    EngineAvailabilityResponse, JobRecordResponse, RuntimeDiagnosticsResponse,
    ToolCapabilityResponse,
};

#[tauri::command]
pub fn list_supported_engines() -> Vec<EngineAvailabilityResponse> {
    engine_registry::list_registered_engines()
        .into_iter()
        .map(|engine| {
            EngineAvailabilityResponse::new(
                engine.key,
                engine.label,
                engine.installed,
                engine.implemented,
                &engine.notes,
                engine.supports_batch,
                engine.supports_password_protected_files,
                engine.supports_ocr,
                engine.requires_external_binary,
            )
        })
        .collect()
}

#[tauri::command]
pub fn get_runtime_diagnostics() -> RuntimeDiagnosticsResponse {
    RuntimeDiagnosticsResponse {
        runtime: "desktop".to_string(),
        invoke_available: true,
        dialog_plugin_expected: true,
        engine_probe_fetched: true,
    }
}

#[tauri::command]
pub fn list_tool_capabilities() -> Vec<ToolCapabilityResponse> {
    let engines = engine_registry::list_registered_engines();
    let runnable_by_key: std::collections::HashMap<&str, bool> = engines
        .iter()
        .map(|engine| (engine.key, engine.runnable()))
        .collect();

    crate::tool_contract::list_tool_capabilities(|engine_key| {
        runnable_by_key.get(engine_key).copied().unwrap_or(false)
    })
}

#[tauri::command]
pub fn cleanup_tmp(max_age_seconds: Option<u64>) -> Result<(), String> {
    let age = max_age_seconds.unwrap_or(60 * 60 * 24 * 7);
    crate::workspace::cleanup_stale_tmp(age).map_err(|error| error.user_message())
}

#[tauri::command]
pub fn list_persisted_jobs() -> Result<Vec<JobRecordResponse>, String> {
    use std::fs;

    let mut output = Vec::new();
    let jobs_dir = crate::workspace::workspace_root()
        .map_err(|error| error.user_message())?
        .join("state")
        .join("jobs");

    if !jobs_dir.exists() {
        return Ok(output);
    }

    let entries =
        fs::read_dir(&jobs_dir).map_err(|error| format!("failed to read jobs dir: {error}"))?;
    for entry in entries.flatten() {
        let entry_path = entry.path();
        let fallback_id = entry_path
            .file_stem()
            .and_then(|value| value.to_str())
            .map(ToString::to_string)
            .unwrap_or_else(|| "unknown".to_string());

        let metadata = match entry.metadata() {
            Ok(metadata) if metadata.is_file() => metadata,
            Ok(_) => continue,
            Err(error) => {
                output.push(build_load_failure_job(
                    fallback_id,
                    format!("Job history metadata read failed: {error}"),
                ));
                continue;
            }
        };
        let _ = metadata;

        let bytes = match fs::read(&entry_path) {
            Ok(bytes) => bytes,
            Err(error) => {
                output.push(build_load_failure_job(
                    fallback_id,
                    format!("Job history read failed: {error}"),
                ));
                continue;
            }
        };

        let mut value = match serde_json::from_slice::<serde_json::Value>(&bytes) {
            Ok(value) => value,
            Err(error) => {
                output.push(build_load_failure_job(
                    fallback_id,
                    format!("Job history parse failed: {error}"),
                ));
                continue;
            }
        };

        let id = value
            .get("id")
            .and_then(|field| field.as_str())
            .map(ToString::to_string)
            .or_else(|| {
                entry_path
                    .file_stem()
                    .and_then(|value| value.to_str())
                    .map(ToString::to_string)
            })
            .unwrap_or_else(|| "unknown".to_string());

        let tool_id = value
            .get("toolId")
            .and_then(|field| field.as_str())
            .unwrap_or("")
            .to_string();
        let tool_name = value
            .get("toolName")
            .and_then(|field| field.as_str())
            .unwrap_or(tool_id.as_str())
            .to_string();
        let input_files = read_string_array(value.get("inputFiles"));
        let options = value
            .get("options")
            .cloned()
            .unwrap_or_else(|| serde_json::json!({}));
        let (options, options_redacted) =
            crate::redaction::sanitize_options_for_persistence(&tool_id, &options);
        let warning = if options_redacted {
            match persist_redacted_job_record(&entry_path, &mut value, &options) {
                Ok(()) => Some(
                    "Loaded a job record with unredacted password fields; values were redacted and written back to disk."
                        .to_string(),
                ),
                Err(error) => Some(format!(
                    "Loaded a job record with unredacted password fields; values were redacted in memory but could not be written back: {error}"
                )),
            }
        } else {
            None
        };

        let (output_files, ok, error) = match value.get("result") {
            Some(result) => (
                read_string_array(
                    result
                        .get("outputPaths")
                        .or_else(|| result.get("output_paths")),
                ),
                result
                    .get("ok")
                    .and_then(|field| field.as_bool())
                    .unwrap_or(false),
                result
                    .get("error")
                    .and_then(|field| field.as_str())
                    .map(ToString::to_string),
            ),
            None => (Vec::new(), false, None),
        };

        let updated_at = value
            .get("updatedAt")
            .and_then(|field| field.as_str())
            .map(ToString::to_string)
            .unwrap_or_else(|| chrono::Utc::now().to_rfc3339());
        let created_at = value
            .get("createdAt")
            .and_then(|field| field.as_str())
            .map(ToString::to_string)
            .unwrap_or_else(|| updated_at.clone());

        output.push(JobRecordResponse {
            id,
            tool_id,
            tool_name,
            status: if ok { "completed" } else { "failed" }.to_string(),
            progress: if ok { 100 } else { 0 },
            input_files,
            output_files,
            options,
            created_at,
            updated_at,
            error,
            warning,
        });
    }

    output.sort_by(|left, right| right.updated_at.cmp(&left.updated_at));
    Ok(output)
}

fn build_load_failure_job(id: String, message: String) -> JobRecordResponse {
    let now = chrono::Utc::now().to_rfc3339();
    JobRecordResponse {
        id,
        tool_id: "unknown".to_string(),
        tool_name: "Recovered Job Record".to_string(),
        status: "failed".to_string(),
        progress: 0,
        input_files: Vec::new(),
        output_files: Vec::new(),
        options: serde_json::json!({}),
        created_at: now.clone(),
        updated_at: now,
        error: Some(message.clone()),
        warning: Some(
            "Job record was partially unreadable and recovered as a failure entry.".to_string(),
        ),
    }
}

fn read_string_array(value: Option<&serde_json::Value>) -> Vec<String> {
    value
        .and_then(|field| field.as_array())
        .map(|array| {
            array
                .iter()
                .filter_map(|item| item.as_str().map(ToString::to_string))
                .collect()
        })
        .unwrap_or_default()
}

fn persist_redacted_job_record(
    entry_path: &std::path::Path,
    value: &mut serde_json::Value,
    options: &serde_json::Value,
) -> Result<(), String> {
    let Some(object) = value.as_object_mut() else {
        return Ok(());
    };

    object.insert("options".to_string(), options.clone());
    object.insert(
        "redactionApplied".to_string(),
        serde_json::Value::Bool(true),
    );

    let bytes = serde_json::to_vec_pretty(value)
        .map_err(|error| format!("failed to serialize sanitized job record: {error}"))?;
    std::fs::write(entry_path, bytes)
        .map_err(|error| format!("failed to rewrite sanitized job record: {error}"))
}
