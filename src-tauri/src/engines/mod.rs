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

/// A request to run an engine.
pub struct EngineRunRequest {
	pub tool_id: String,
	pub input_paths: Vec<PathBuf>,
	pub output_path: PathBuf,
	pub workspace: Option<PathBuf>,
	pub options: Option<serde_json::Value>,
}

/// The standardized result from running an engine.
pub struct EngineRunResult {
	pub output_paths: Vec<PathBuf>,
	pub logs: Option<String>,
	pub warnings: Vec<String>,
	pub duration_ms: u128,
	pub stats: Option<serde_json::Value>,
}

/// Centralized runner that maps tool ids to engine implementations
/// and returns a structured result. Engines may be gradually adapted
/// to provide richer logs/stats; this adapter keeps compatibility
/// with existing simple `run` functions which return `AppResult<()>`.
pub fn run_tool(req: EngineRunRequest) -> AppResult<EngineRunResult> {
	let start = Instant::now();

	let file_names: Vec<String> = req
		.input_paths
		.iter()
		.map(|p| p.to_string_lossy().to_string())
		.collect();

	// Dispatch to existing engine modules
	let res = if matches!(
		req.tool_id.as_str(),
		"merge-pdf" | "split-pdf" | "rotate-pdf" | "organize-pdf" | "unlock-pdf" | "protect-pdf"
	) {
		qpdf::run(&req.tool_id, &file_names, &req.output_path, req.options.as_ref())
	} else if matches!(req.tool_id.as_str(), "word-to-pdf" | "powerpoint-to-pdf" | "excel-to-pdf") {
		libreoffice::run(&req.tool_id, &file_names, &req.output_path, req.options.as_ref())
	} else if matches!(req.tool_id.as_str(), "pdf-to-jpg" | "jpg-to-pdf" | "compare-pdf") {
		render::run(&req.tool_id, &file_names, &req.output_path, req.options.as_ref())
	} else if matches!(req.tool_id.as_str(), "ocr-pdf") {
		ocr::run(&req.tool_id, &file_names, &req.output_path, req.options.as_ref())
	} else if matches!(req.tool_id.as_str(), "html-to-pdf") {
		html::run(&req.tool_id, &file_names, &req.output_path, req.options.as_ref())
	} else if matches!(
		req.tool_id.as_str(),
		"watermark" | "page-numbers" | "sign-pdf" | "crop-pdf" | "redact-pdf" | "edit-pdf"
	) {
		watermark::run(&req.tool_id, &file_names, &req.output_path, req.options.as_ref())
	} else {
		return Err(AppError::EngineNotImplemented(req.tool_id.clone()));
	};

	// If engine returned an error, propagate it
	res.map(|()| EngineRunResult {
		output_paths: vec![req.output_path.clone()],
		logs: None,
		warnings: Vec::new(),
		duration_ms: start.elapsed().as_millis(),
		stats: None,
	})
}
