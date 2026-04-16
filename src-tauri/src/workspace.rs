use std::fs;
use std::path::PathBuf;

use crate::errors::AppResult;

pub fn workspace_root() -> AppResult<PathBuf> {
    let root = PathBuf::from(".pdf-powerhouse");
    if !root.exists() {
        fs::create_dir_all(&root)?;
    }
    Ok(root)
}

pub fn create_job_workspace(job_id: &str) -> AppResult<PathBuf> {
    let path = workspace_root()?.join("tmp").join(job_id);
    if !path.exists() {
        fs::create_dir_all(&path)?;
    }
    Ok(path)
}

pub fn ensure_output_root() -> AppResult<PathBuf> {
    let output = workspace_root()?.join("outputs");
    if !output.exists() {
        fs::create_dir_all(&output)?;
    }
    Ok(output)
}
