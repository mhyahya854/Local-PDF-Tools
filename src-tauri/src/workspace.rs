use std::fs;
use std::path::{Path, PathBuf};
use std::time::SystemTime;

use crate::errors::{AppError, AppResult};

fn validate_job_id(job_id: &str) -> Result<(), AppError> {
    if job_id.is_empty() {
        return Err(AppError::Message("job_id must not be empty".to_string()));
    }

    if job_id.contains('/') || job_id.contains('\\') || job_id.contains("..") || job_id.contains('.') {
        return Err(AppError::Message(
            "job_id contains disallowed characters (separators, dots, or traversal)".to_string(),
        ));
    }

    if !job_id.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_') {
        return Err(AppError::Message(
            "job_id contains invalid characters; only A-Za-z0-9_- are allowed".to_string(),
        ));
    }

    if job_id.len() > 128 {
        return Err(AppError::Message("job_id is too long".to_string()));
    }

    Ok(())
}

pub fn workspace_root() -> AppResult<PathBuf> {
    // Prefer the OS-local application data directory when available.
    if let Some(mut app_data) = dirs_next::data_local_dir() {
        app_data.push("pdf-powerhouse");
        if !app_data.exists() {
            fs::create_dir_all(&app_data)?;
        }
        return Ok(app_data.canonicalize()?);
    }

    // Fallback to a hidden directory in the current working directory.
    let mut root = std::env::current_dir()?.join(".pdf-powerhouse");
    if !root.exists() {
        fs::create_dir_all(&root)?;
    }
    Ok(root.canonicalize()?)
}

pub fn create_job_workspace(job_id: &str) -> AppResult<PathBuf> {
    validate_job_id(job_id)?;

    let root = workspace_root()?;
    let tmp_root = root.join("tmp");
    if !tmp_root.exists() {
        fs::create_dir_all(&tmp_root)?;
    }

    let path = tmp_root.join(job_id);
    if !path.exists() {
        fs::create_dir_all(&path)?;
    }

    let canonical_root = root.canonicalize()?;
    let canonical_path = path.canonicalize()?;
    if !canonical_path.starts_with(&canonical_root) {
        return Err(AppError::Message(format!(
            "Invalid job workspace path (path traversal detected): {}",
            job_id
        )));
    }

    Ok(canonical_path)
}

pub fn ensure_output_root() -> AppResult<PathBuf> {
    let root = workspace_root()?;
    let output = root.join("outputs");
    if !output.exists() {
        fs::create_dir_all(&output)?;
    }
    Ok(output.canonicalize()?)
}

// -- Safe path helpers -------------------------------------------------

/// Return a canonical output file path for a given tool and extension.
/// Does not create the file but ensures the outputs directory exists.
pub fn output_file_path_for_tool(tool_id: &str, output_extension: &str) -> AppResult<PathBuf> {
    let output_root = ensure_output_root()?; // already canonicalized
    let name = format!("{}-result.{}", tool_id, output_extension);
    Ok(output_root.join(name))
}

/// Remove a job workspace (safe-checked). Validates `job_id` and ensures
/// the target sits inside the canonical workspace root before deleting.
pub fn cleanup_job_workspace(job_id: &str) -> AppResult<()> {
    validate_job_id(job_id)?;

    let root = workspace_root()?;
    let path = root.join("tmp").join(job_id);
    if !path.exists() {
        return Ok(());
    }

    let canonical_root = root.canonicalize()?;
    let canonical_path = path.canonicalize()?;
    if !canonical_path.starts_with(&canonical_root) {
        return Err(AppError::Message(format!(
            "Invalid job workspace path (path traversal detected): {}",
            job_id
        )));
    }

    fs::remove_dir_all(&canonical_path)?;
    Ok(())
}

/// Sweep and delete stale job tmp directories older than `max_age_seconds`.
/// Returns the number of removed directories.
pub fn cleanup_stale_tmp(max_age_seconds: u64) -> AppResult<usize> {
    let root = workspace_root()?;
    let tmp_root = root.join("tmp");
    if !tmp_root.exists() {
        return Ok(0);
    }

    let mut removed = 0usize;
    let now = SystemTime::now();

    for entry in fs::read_dir(&tmp_root)? {
        let entry = entry?;
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }

        let meta = match entry.metadata() {
            Ok(m) => m,
            Err(_) => continue,
        };

        let modified = match meta.modified() {
            Ok(t) => t,
            Err(_) => continue,
        };

        let age = now.duration_since(modified).unwrap_or_default().as_secs();
        if age <= max_age_seconds {
            continue;
        }

        let canonical_root = root.canonicalize()?;
        let canonical_path = match path.canonicalize() {
            Ok(p) => p,
            Err(_) => continue,
        };

        if !canonical_path.starts_with(&canonical_root) {
            continue;
        }

        if fs::remove_dir_all(&canonical_path).is_ok() {
            removed += 1;
        }
    }

    Ok(removed)
}

/// Check whether a path is contained inside the workspace root.
pub fn path_is_within_workspace(p: &Path) -> AppResult<bool> {
    let root = workspace_root()?;
    let canonical_root = root.canonicalize()?;
    match p.canonicalize() {
        Ok(canonical_path) => Ok(canonical_path.starts_with(&canonical_root)),
        Err(_) => Ok(false),
    }
}

