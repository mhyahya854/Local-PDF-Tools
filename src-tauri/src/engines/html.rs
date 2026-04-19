use std::path::Path;

use serde_json::Value;

use crate::errors::AppResult;

pub fn run(_tool_id: &str, _file_names: &[String], _output_file: &Path, _options: Option<&Value>) -> AppResult<()> {
    // Placeholder: HTML-to-PDF engine will be implemented later.
    Ok(())
}
