use std::path::{Path, PathBuf};

use serde_json::Value;

use crate::errors::{AppError, AppResult};

pub fn run(
    tool_id: &str,
    _file_names: &[String],
    _output_file: &Path,
    _options: Option<&Value>,
) -> AppResult<Vec<PathBuf>> {
    Err(AppError::EngineNotImplemented(tool_id.to_string()))
}
