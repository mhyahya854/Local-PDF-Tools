use std::fs;
use std::path::Path;

use crate::engines;
use crate::errors::{AppError, AppResult};
use crate::types::{ToolExecutionRequest, ToolExecutionResult};
use crate::workspace;

#[tauri::command]
pub async fn run_tool_job(request: ToolExecutionRequest) -> Result<ToolExecutionResult, String> {
    execute_job(request).map_err(|error| error.user_message())
}

#[tauri::command]
pub fn open_output_path(path: String) -> Result<(), String> {
    let output_path = Path::new(&path);
    if output_path.exists() {
        Ok(())
    } else {
        Err(format!("Output path does not exist: {path}"))
    }
}

fn execute_job(request: ToolExecutionRequest) -> AppResult<ToolExecutionResult> {
    let _job_workspace = workspace::create_job_workspace(&request.job_id)?;
    let output_root = workspace::ensure_output_root()?;

    let output_name = format!("{}-result.{}", request.tool_id, request.output_extension);
    let output_file = output_root.join(output_name);

    dispatch_engine(&request, &output_file)?;

    fs::write(
        &output_file,
        format!(
            "Placeholder output for tool={} files={} options={}",
            request.tool_id,
            request.file_names.len(),
            request.options
        ),
    )?;

    Ok(ToolExecutionResult {
        ok: true,
        output_paths: vec![output_file.to_string_lossy().to_string()],
        error: None,
        warning: Some("Engine dispatch is scaffolded and currently writes placeholder output.".to_string()),
    })
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

    Err(AppError::Message(format!(
        "No engine route is defined for tool id: {tool_id}"
    )))
}
