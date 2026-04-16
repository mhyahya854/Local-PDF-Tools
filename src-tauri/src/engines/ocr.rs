use std::path::Path;

use crate::errors::AppResult;

pub fn run(_tool_id: &str, _file_names: &[String], _output_file: &Path) -> AppResult<()> {
    Ok(())
}
