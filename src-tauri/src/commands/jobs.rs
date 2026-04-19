use std::fs;
use std::path::{Path, PathBuf};
use std::time::Instant;

use crate::engines;
use crate::errors::{AppError, AppResult};
use crate::types::{ToolExecutionRequest, ToolExecutionResult};
use crate::workspace;
use serde_json::{json, Value};

#[tauri::command]
pub async fn run_tool_job(request: ToolExecutionRequest) -> Result<ToolExecutionResult, String> {
    execute_job(request).map_err(|error| error.user_message())
}

#[tauri::command]
pub fn open_output_path(path: String) -> Result<(), String> {
    let output_path = Path::new(&path);
    if !output_path.exists() {
        return Err(format!("Output path does not exist: {}", path));
    }

    // Try to open or reveal the file/directory using platform-specific commands.
    if output_path.is_dir() {
        if cfg!(target_os = "windows") {
            std::process::Command::new("explorer")
                .arg(output_path.to_string_lossy().to_string())
                .spawn()
                .map_err(|e| format!("Failed to open directory: {}", e))?;
        } else if cfg!(target_os = "macos") {
            std::process::Command::new("open")
                .arg(output_path.to_string_lossy().to_string())
                .spawn()
                .map_err(|e| format!("Failed to open directory: {}", e))?;
        } else {
            std::process::Command::new("xdg-open")
                .arg(output_path.to_string_lossy().to_string())
                .spawn()
                .map_err(|e| format!("Failed to open directory: {}", e))?;
        }
    } else {
        // it's a file: prefer revealing in file manager
        if cfg!(target_os = "windows") {
            let arg = format!("/select,{}", output_path.to_string_lossy());
            std::process::Command::new("explorer")
                .arg(arg)
                .spawn()
                .map_err(|e| format!("Failed to reveal file: {}", e))?;
        } else if cfg!(target_os = "macos") {
            std::process::Command::new("open")
                .arg("-R")
                .arg(output_path.to_string_lossy().to_string())
                .spawn()
                .map_err(|e| format!("Failed to reveal file: {}", e))?;
        } else {
            if let Some(parent) = output_path.parent() {
                std::process::Command::new("xdg-open")
                    .arg(parent.to_string_lossy().to_string())
                    .spawn()
                    .map_err(|e| format!("Failed to reveal file: {}", e))?;
            } else {
                std::process::Command::new("xdg-open")
                    .arg(output_path.to_string_lossy().to_string())
                    .spawn()
                    .map_err(|e| format!("Failed to open file: {}", e))?;
            }
        }
    }

    Ok(())
}

fn execute_job(request: ToolExecutionRequest) -> AppResult<ToolExecutionResult> {
    // Pipeline: validate -> workspace -> stage inputs -> select engine -> run -> verify -> persist
    let start = Instant::now();

    // Basic request validation
    if request.tool_id.trim().is_empty() {
        return Ok(ToolExecutionResult {
            ok: false,
            output_paths: vec![],
            error: Some("tool_id must not be empty".to_string()),
            warning: None,
        });
    }

    if request.output_extension.contains('/') || request.output_extension.contains('\\') {
        return Ok(ToolExecutionResult {
            ok: false,
            output_paths: vec![],
            error: Some("invalid output extension".to_string()),
            warning: None,
        });
    }

    // Create workspace for this job
    let job_workspace = workspace::create_job_workspace(&request.job_id)?;

    // Stage input files into the job workspace
    let staged_inputs = match stage_input_files(&request.file_names, &request.job_id, &job_workspace) {
        Ok(v) => v,
        Err(message) => {
            // Persist failed job metadata and return structured failure
            let result = ToolExecutionResult {
                ok: false,
                output_paths: vec![],
                error: Some(message.clone()),
                warning: None,
            };
            let _ = persist_job_result(&request.job_id, &request, &result, start.elapsed().as_millis());
            return Ok(result);
        }
    };

    // Determine output file path
    let output_file = workspace::output_file_path_for_tool(&request.tool_id, &request.output_extension)?;

    // Run engine (pass through request options)
    let engine_run = dispatch_engine_with_inputs(&request.tool_id, &staged_inputs, &output_file, Some(&request.options));

    let result = match engine_run {
        Ok(()) => {
            // Verify output
            if !output_file.exists() {
                ToolExecutionResult {
                    ok: false,
                    output_paths: vec![],
                    error: Some(format!("Engine did not produce expected output: {}", output_file.to_string_lossy())),
                    warning: None,
                }
            } else {
                match fs::metadata(&output_file) {
                    Ok(meta) if meta.len() > 0 => ToolExecutionResult {
                        ok: true,
                        output_paths: vec![output_file.to_string_lossy().to_string()],
                        error: None,
                        warning: None,
                    },
                    _ => ToolExecutionResult {
                        ok: false,
                        output_paths: vec![],
                        error: Some(format!("Engine produced empty output: {}", output_file.to_string_lossy())),
                        warning: None,
                    },
                }
            }
        }
        Err(e) => {
            // If engine not implemented or other known error, return structured failure
            ToolExecutionResult {
                ok: false,
                output_paths: vec![],
                error: Some(e.user_message()),
                warning: None,
            }
        }
    };

    // Persist result (best-effort)
    let _ = persist_job_result(&request.job_id, &request, &result, start.elapsed().as_millis());

    Ok(result)
}

fn stage_input_files(file_names: &[String], job_id: &str, job_workspace: &Path) -> Result<Vec<PathBuf>, String> {
    if file_names.is_empty() {
        return Err("No input files provided".to_string());
    }

    let inputs_dir = job_workspace.join("inputs");
    if !inputs_dir.exists() {
        if let Err(e) = fs::create_dir_all(&inputs_dir) {
            return Err(format!("Failed to create inputs directory: {e}"));
        }
    }

    let mut staged = Vec::new();

    for name in file_names {
        // Try candidate locations for the source file
        let mut candidates: Vec<PathBuf> = Vec::new();

        let p = Path::new(name);
        if p.is_absolute() {
            candidates.push(p.to_path_buf());
        }

        if let Ok(root) = workspace::workspace_root() {
            candidates.push(root.join("uploads").join(job_id).join(name));
            candidates.push(root.join("uploads").join(name));
            candidates.push(root.join("tmp").join(job_id).join(name));
        }

        if let Ok(cwd) = std::env::current_dir() {
            candidates.push(cwd.join(name));
        }

        // Find the first existing candidate
        let mut found: Option<PathBuf> = None;
        for c in candidates {
            if c.exists() && c.is_file() {
                found = Some(c);
                break;
            }
        }

        let src = match found {
            Some(p) => p,
            None => return Err(format!("Input file not found or not staged: {}", name)),
        };

        // Copy into job inputs directory
        let dest = inputs_dir.join(Path::new(name).file_name().unwrap_or_else(|| std::ffi::OsStr::new(name)).to_string_lossy().to_string());
        if let Err(e) = fs::copy(&src, &dest) {
            return Err(format!("Failed to copy input file {}: {}", name, e));
        }

        staged.push(dest);
    }

    Ok(staged)
}

fn dispatch_engine_with_inputs(tool_id: &str, input_paths: &[PathBuf], output_file: &Path, options: Option<&Value>) -> AppResult<()> {
    // Build standardized engine request and delegate to central runner
    let req = engines::EngineRunRequest {
        tool_id: tool_id.to_string(),
        input_paths: input_paths.to_vec(),
        output_path: output_file.to_path_buf(),
        workspace: None,
        options: options.cloned(),
    };

    let run_result = engines::run_tool(req)?;

    if run_result.output_paths.is_empty() {
        return Err(AppError::Message("Engine did not report any outputs".to_string()));
    }

    Ok(())
}

fn persist_job_result(job_id: &str, request: &ToolExecutionRequest, result: &ToolExecutionResult, duration_ms: u128) -> AppResult<()> {
    let mut state_dir = workspace::workspace_root()?;
    state_dir.push("state");
    state_dir.push("jobs");
    if !state_dir.exists() {
        fs::create_dir_all(&state_dir)?;
    }

    let record = json!({
        "id": job_id,
        "toolId": request.tool_id,
        "inputFiles": request.file_names,
        "outputExtension": request.output_extension,
        "result": result,
        "durationMs": duration_ms,
        "updatedAt": chrono::Utc::now().to_rfc3339(),
    });

    let file_path = state_dir.join(format!("{}.json", job_id));
    fs::write(file_path, serde_json::to_vec_pretty(&record)?)?;
    Ok(())
}

fn dispatch_engine(request: &ToolExecutionRequest, output_file: &Path) -> AppResult<()> {
    let tool_id = request.tool_id.as_str();

    if matches!(
        tool_id,
        "merge-pdf" | "split-pdf" | "rotate-pdf" | "organize-pdf" | "unlock-pdf" | "protect-pdf"
    ) {
        return engines::qpdf::run(tool_id, &request.file_names, output_file);
    }

    if matches!(tool_id, "word-to-pdf" | "powerpoint-to-pdf" | "excel-to-pdf") {
        return engines::libreoffice::run(tool_id, &request.file_names, output_file);
    }

    if matches!(tool_id, "pdf-to-jpg" | "jpg-to-pdf" | "compare-pdf") {
        return engines::render::run(tool_id, &request.file_names, output_file);
    }

    if matches!(tool_id, "ocr-pdf") {
        return engines::ocr::run(tool_id, &request.file_names, output_file);
    }

    if matches!(tool_id, "html-to-pdf") {
        return engines::html::run(tool_id, &request.file_names, output_file);
    }

    if matches!(
        tool_id,
        "watermark" | "page-numbers" | "sign-pdf" | "crop-pdf" | "redact-pdf" | "edit-pdf"
    ) {
        return engines::watermark::run(tool_id, &request.file_names, output_file);
    }

    Err(AppError::EngineNotImplemented(tool_id.to_string()))
}
