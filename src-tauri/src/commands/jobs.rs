use std::fs;
use std::path::{Path, PathBuf};
use std::time::Instant;

use serde_json::{json, Value};

use crate::engine_registry;
use crate::engines;
use crate::errors::{AppError, AppResult};
use crate::tool_contract;
use crate::types::{ToolExecutionInputFile, ToolExecutionRequest, ToolExecutionResult};
use crate::workspace;

#[tauri::command]
pub async fn run_tool_job(request: ToolExecutionRequest) -> Result<ToolExecutionResult, String> {
    execute_job(request).map_err(|error| error.user_message())
}

#[tauri::command]
pub fn open_output_path(path: String) -> Result<(), String> {
    let output_path = Path::new(&path);
    if !output_path.exists() {
        return Err(format!("Output path does not exist: {path}"));
    }

    let within_workspace =
        workspace::path_is_within_workspace(output_path).map_err(|error| error.user_message())?;
    if !within_workspace {
        return Err("Refusing to open a path outside the app workspace.".to_string());
    }

    if output_path.is_dir() {
        if cfg!(target_os = "windows") {
            std::process::Command::new("explorer")
                .arg(output_path)
                .spawn()
                .map_err(|error| format!("Failed to open directory: {error}"))?;
        } else if cfg!(target_os = "macos") {
            std::process::Command::new("open")
                .arg(output_path)
                .spawn()
                .map_err(|error| format!("Failed to open directory: {error}"))?;
        } else {
            std::process::Command::new("xdg-open")
                .arg(output_path)
                .spawn()
                .map_err(|error| format!("Failed to open directory: {error}"))?;
        }
    } else if cfg!(target_os = "windows") {
        let arg = format!("/select,{}", output_path.to_string_lossy());
        std::process::Command::new("explorer")
            .arg(arg)
            .spawn()
            .map_err(|error| format!("Failed to reveal file: {error}"))?;
    } else if cfg!(target_os = "macos") {
        std::process::Command::new("open")
            .arg("-R")
            .arg(output_path)
            .spawn()
            .map_err(|error| format!("Failed to reveal file: {error}"))?;
    } else if let Some(parent) = output_path.parent() {
        std::process::Command::new("xdg-open")
            .arg(parent)
            .spawn()
            .map_err(|error| format!("Failed to reveal file: {error}"))?;
    } else {
        std::process::Command::new("xdg-open")
            .arg(output_path)
            .spawn()
            .map_err(|error| format!("Failed to open file: {error}"))?;
    }

    Ok(())
}

fn execute_job(request: ToolExecutionRequest) -> AppResult<ToolExecutionResult> {
    let start = Instant::now();
    let created_at = chrono::Utc::now().to_rfc3339();

    if request.output_extension.contains('/') || request.output_extension.contains('\\') {
        return Ok(failure_result("invalid output extension"));
    }

    if let Err(error) = tool_contract::validate_execution_request(&request, |engine_key| {
        engine_registry::is_engine_available(engine_key)
    }) {
        return Ok(failure_result(&error.user_message()));
    }

    let job_workspace = workspace::create_job_workspace(&request.job_id)?;

    let resolved_inputs = match resolve_input_files(&request.input_files) {
        Ok(inputs) => inputs,
        Err(message) => {
            let mut result = failure_result(&message);
            result.warning = Some(format!(
                "Temporary job workspace retained for diagnostics: {}",
                job_workspace.to_string_lossy()
            ));
            let _ = persist_job_result(
                &request.job_id,
                &request,
                &result,
                start.elapsed().as_millis(),
                &created_at,
            );
            return Ok(result);
        }
    };

    let primary_input_name = request
        .input_files
        .first()
        .map(|file| file.name.as_str())
        .unwrap_or(request.tool_id.as_str());
    let output_file = match workspace::output_file_path_for_job(
        &request.job_id,
        &request.tool_id,
        primary_input_name,
        &request.output_extension,
        request.output_directory.as_deref(),
    ) {
        Ok(path) => path,
        Err(error) => {
            let mut result = failure_result(&error.user_message());
            result.warning = Some(format!(
                "Temporary job workspace retained for diagnostics: {}",
                job_workspace.to_string_lossy()
            ));
            let _ = persist_job_result(
                &request.job_id,
                &request,
                &result,
                start.elapsed().as_millis(),
                &created_at,
            );
            return Ok(result);
        }
    };

    let mut result = match dispatch_engine_with_inputs(
        &request.tool_id,
        &resolved_inputs,
        &output_file,
        &job_workspace,
        Some(&request.options),
    ) {
        Ok(output_paths) => verify_output_paths(output_paths),
        Err(error) => failure_result(&error.user_message()),
    };

    if !result.ok {
        result.warning = Some(format!(
            "Temporary job workspace retained for diagnostics: {}",
            job_workspace.to_string_lossy()
        ));
    }

    let _ = persist_job_result(
        &request.job_id,
        &request,
        &result,
        start.elapsed().as_millis(),
        &created_at,
    );

    if result.ok {
        let _ = workspace::cleanup_job_workspace(&request.job_id);
    }

    Ok(result)
}

fn resolve_input_files(input_files: &[ToolExecutionInputFile]) -> Result<Vec<PathBuf>, String> {
    let mut resolved = Vec::new();

    for input_file in input_files {
        let source_path = input_file
            .path
            .as_deref()
            .filter(|path| !path.trim().is_empty())
            .map(PathBuf::from)
            .ok_or_else(|| format!("Input file path is missing for {}", input_file.name))?;

        let source_path = source_path.canonicalize().map_err(|error| {
            format!(
                "Input file could not be resolved for {}: {}",
                input_file.name, error
            )
        })?;

        if !source_path.is_file() {
            return Err(format!("Input file is not readable: {}", input_file.name));
        }

        resolved.push(source_path);
    }

    Ok(resolved)
}

fn dispatch_engine_with_inputs(
    tool_id: &str,
    input_paths: &[PathBuf],
    output_file: &Path,
    scratch_dir: &Path,
    options: Option<&Value>,
) -> AppResult<Vec<PathBuf>> {
    let request = engines::EngineRunRequest {
        tool_id: tool_id.to_string(),
        input_paths: input_paths.to_vec(),
        output_path: output_file.to_path_buf(),
        scratch_dir: Some(scratch_dir.to_path_buf()),
        options: options.cloned(),
    };

    let run_result = engines::run_tool(request)?;
    let _ = (
        &run_result.logs,
        &run_result.warnings,
        run_result.duration_ms,
        &run_result.stats,
    );

    if run_result.output_paths.is_empty() {
        return Err(AppError::Message(
            "Engine did not report any outputs".to_string(),
        ));
    }

    Ok(run_result.output_paths)
}

fn verify_output_paths(output_paths: Vec<PathBuf>) -> ToolExecutionResult {
    if output_paths.is_empty() {
        return failure_result("Engine did not produce any output files.");
    }

    for path in &output_paths {
        if !path.exists() {
            return failure_result(&format!(
                "Engine did not produce the expected output: {}",
                path.to_string_lossy()
            ));
        }

        let within_workspace = match workspace::path_is_within_workspace(path) {
            Ok(value) => value,
            Err(error) => {
                return failure_result(&format!(
                    "Engine output could not be validated against the app workspace: {}",
                    error.user_message()
                ));
            }
        };

        if !within_workspace {
            return failure_result(&format!(
                "Engine reported an output outside the app workspace: {}",
                path.to_string_lossy()
            ));
        }

        match fs::metadata(path) {
            Ok(metadata) if metadata.is_file() && metadata.len() > 0 => {}
            Ok(metadata) if !metadata.is_file() => {
                return failure_result(&format!(
                    "Engine output is not a regular file: {}",
                    path.to_string_lossy()
                ));
            }
            Ok(_) => {
                return failure_result(&format!(
                    "Engine produced an empty output file: {}",
                    path.to_string_lossy()
                ));
            }
            Err(error) => {
                return failure_result(&format!(
                    "Engine output could not be inspected: {} ({error})",
                    path.to_string_lossy()
                ));
            }
        }
    }

    ToolExecutionResult {
        ok: true,
        output_paths: output_paths
            .into_iter()
            .map(|path| path.to_string_lossy().to_string())
            .collect(),
        error: None,
        warning: None,
    }
}

fn persist_job_result(
    job_id: &str,
    request: &ToolExecutionRequest,
    result: &ToolExecutionResult,
    duration_ms: u128,
    created_at: &str,
) -> AppResult<()> {
    let mut state_dir = workspace::workspace_root()?;
    state_dir.push("state");
    state_dir.push("jobs");
    if !state_dir.exists() {
        fs::create_dir_all(&state_dir)?;
    }

    let input_files: Vec<String> = request
        .input_files
        .iter()
        .map(|file| file.name.clone())
        .collect();
    let (persisted_options, options_redacted) =
        crate::redaction::sanitize_options_for_persistence(&request.tool_id, &request.options);

    let record = json!({
        "schemaVersion": 1,
        "id": job_id,
        "toolId": request.tool_id,
        "toolName": humanize_tool_id(&request.tool_id),
        "inputFiles": input_files,
        "outputExtension": request.output_extension,
        "outputDirectory": request.output_directory,
        "options": persisted_options,
        "redactionApplied": options_redacted,
        "result": result,
        "durationMs": duration_ms,
        "createdAt": created_at,
        "updatedAt": chrono::Utc::now().to_rfc3339(),
    });

    let file_path = state_dir.join(format!("{job_id}.json"));
    fs::write(file_path, serde_json::to_vec_pretty(&record)?)?;
    Ok(())
}

fn failure_result(message: &str) -> ToolExecutionResult {
    ToolExecutionResult {
        ok: false,
        output_paths: Vec::new(),
        error: Some(message.to_string()),
        warning: None,
    }
}

fn humanize_tool_id(tool_id: &str) -> String {
    tool_id
        .split('-')
        .filter(|part| !part.is_empty())
        .map(capitalize)
        .collect::<Vec<String>>()
        .join(" ")
}

fn capitalize(value: &str) -> String {
    let mut chars = value.chars();
    match chars.next() {
        Some(first) => format!("{}{}", first.to_ascii_uppercase(), chars.as_str()),
        None => String::new(),
    }
}
