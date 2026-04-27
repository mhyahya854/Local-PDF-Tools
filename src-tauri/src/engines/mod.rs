pub mod html;
pub mod libreoffice;
pub mod ocr;
pub mod qpdf;
pub mod render;
pub mod watermark;

use std::path::PathBuf;
use std::time::Instant;

use serde_json::Value;

use crate::errors::{AppError, AppResult};

pub struct EngineRunRequest {
    pub tool_id: String,
    pub input_paths: Vec<PathBuf>,
    pub output_path: PathBuf,
    pub scratch_dir: Option<PathBuf>,
    pub options: Option<Value>,
}

pub struct EngineRunResult {
    pub output_paths: Vec<PathBuf>,
    pub logs: Option<String>,
    pub warnings: Vec<String>,
    pub duration_ms: u128,
    pub stats: Option<Value>,
}

pub fn run_tool(req: EngineRunRequest) -> AppResult<EngineRunResult> {
    let start = Instant::now();

    let file_names: Vec<String> = req
        .input_paths
        .iter()
        .map(|path| path.to_string_lossy().to_string())
        .collect();

    let output_paths = if matches!(
        req.tool_id.as_str(),
        "merge-pdf" | "split-pdf" | "rotate-pdf" | "unlock-pdf" | "protect-pdf"
    ) {
        qpdf::run(
            &req.tool_id,
            &file_names,
            &req.output_path,
            req.scratch_dir.as_deref(),
            req.options.as_ref(),
        )?
    } else if matches!(
        req.tool_id.as_str(),
        "word-to-pdf" | "powerpoint-to-pdf" | "excel-to-pdf"
    ) {
        libreoffice::run(
            &req.tool_id,
            &file_names,
            &req.output_path,
            req.options.as_ref(),
        )?
    } else if matches!(
        req.tool_id.as_str(),
        "pdf-to-jpg" | "jpg-to-pdf" | "compare-pdf"
    ) {
        render::run(
            &req.tool_id,
            &file_names,
            &req.output_path,
            req.options.as_ref(),
        )?
    } else if matches!(req.tool_id.as_str(), "ocr-pdf") {
        ocr::run(
            &req.tool_id,
            &file_names,
            &req.output_path,
            req.options.as_ref(),
        )?
    } else if matches!(req.tool_id.as_str(), "html-to-pdf") {
        html::run(
            &req.tool_id,
            &file_names,
            &req.output_path,
            req.options.as_ref(),
        )?
    } else if matches!(
        req.tool_id.as_str(),
        "watermark" | "page-numbers" | "sign-pdf" | "crop-pdf" | "redact-pdf" | "edit-pdf"
    ) {
        watermark::run(
            &req.tool_id,
            &file_names,
            &req.output_path,
            req.options.as_ref(),
        )?
    } else {
        return Err(AppError::EngineNotImplemented(req.tool_id));
    };

    Ok(EngineRunResult {
        output_paths,
        logs: None,
        warnings: Vec::new(),
        duration_ms: start.elapsed().as_millis(),
        stats: None,
    })
}
