use std::fs;
use std::path::{Path, PathBuf};
use std::time::SystemTime;

use crate::errors::{AppError, AppResult};

fn validate_job_id(job_id: &str) -> Result<(), AppError> {
    if job_id.is_empty() {
        return Err(AppError::Message("job_id must not be empty".to_string()));
    }

    if job_id.contains('/')
        || job_id.contains('\\')
        || job_id.contains("..")
        || job_id.contains('.')
    {
        return Err(AppError::Message(
            "job_id contains disallowed characters (separators, dots, or traversal)".to_string(),
        ));
    }

    if !job_id
        .chars()
        .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
    {
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
    if let Some(mut app_data) = dirs_next::data_local_dir() {
        app_data.push("pdf-powerhouse");
        if !app_data.exists() {
            fs::create_dir_all(&app_data)?;
        }
        return Ok(app_data.canonicalize()?);
    }

    let root = std::env::current_dir()?.join(".pdf-powerhouse");
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
            "Invalid job workspace path (path traversal detected): {job_id}"
        )));
    }

    Ok(canonical_path)
}

pub fn ensure_output_root(output_root_hint: Option<&str>) -> AppResult<PathBuf> {
    let root = workspace_root()?;
    let output = resolve_workspace_output_root(&root, output_root_hint)?;
    if !output.exists() {
        fs::create_dir_all(&output)?;
    }
    Ok(output.canonicalize()?)
}

pub fn output_dir_for_job(
    job_id: &str,
    tool_id: &str,
    output_root_hint: Option<&str>,
) -> AppResult<PathBuf> {
    validate_job_id(job_id)?;

    let output_root = ensure_output_root(output_root_hint)?;
    let tool_segment = sanitize_segment(tool_id);
    let job_dir = output_root.join(tool_segment).join(job_id);

    if !job_dir.exists() {
        fs::create_dir_all(&job_dir)?;
    }

    let canonical_dir = job_dir.canonicalize()?;
    if !canonical_dir.starts_with(&output_root) {
        return Err(AppError::Message(format!(
            "Invalid output directory for tool {tool_id}"
        )));
    }

    Ok(canonical_dir)
}

pub fn output_file_path_for_job(
    job_id: &str,
    tool_id: &str,
    preferred_name: &str,
    output_extension: &str,
    output_root_hint: Option<&str>,
) -> AppResult<PathBuf> {
    let output_dir = output_dir_for_job(job_id, tool_id, output_root_hint)?;
    let extension = sanitize_extension(output_extension)?;
    let base_name = build_output_base_name(tool_id, preferred_name);

    Ok(output_dir.join(format!("{base_name}.{extension}")))
}

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
            "Invalid job workspace path (path traversal detected): {job_id}"
        )));
    }

    fs::remove_dir_all(&canonical_path)?;
    Ok(())
}

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
            Ok(metadata) => metadata,
            Err(_) => continue,
        };

        let modified = match meta.modified() {
            Ok(modified_time) => modified_time,
            Err(_) => continue,
        };

        let age = now.duration_since(modified).unwrap_or_default().as_secs();
        if age <= max_age_seconds {
            continue;
        }

        let canonical_root = root.canonicalize()?;
        let canonical_path = match path.canonicalize() {
            Ok(value) => value,
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

pub fn path_is_within_workspace(path: &Path) -> AppResult<bool> {
    let root = workspace_root()?;
    let canonical_root = root.canonicalize()?;
    match path.canonicalize() {
        Ok(canonical_path) => Ok(canonical_path.starts_with(&canonical_root)),
        Err(_) => Ok(false),
    }
}

pub fn path_is_within_output_root(path: &Path) -> AppResult<bool> {
    let output_root = ensure_output_root(None)?;
    match path.canonicalize() {
        Ok(canonical_path) => Ok(canonical_path.starts_with(&output_root)),
        Err(_) => Ok(false),
    }
}

fn resolve_workspace_output_root(
    workspace_root: &Path,
    output_root_hint: Option<&str>,
) -> AppResult<PathBuf> {
    let requested = output_root_hint.unwrap_or("outputs").trim();
    let normalized = if requested.is_empty() {
        "outputs"
    } else {
        requested
    };

    let candidate = Path::new(normalized);
    if candidate.is_absolute() {
        return Err(AppError::Message(
            "Output directory must be a relative path under the app workspace.".to_string(),
        ));
    }

    let mut output_root = workspace_root.to_path_buf();
    for part in normalized.split(['/', '\\']) {
        let trimmed = part.trim();
        if trimmed.is_empty() {
            continue;
        }

        if trimmed == "." || trimmed == ".." {
            return Err(AppError::Message(
                "Output directory contains invalid path traversal segments.".to_string(),
            ));
        }

        output_root.push(sanitize_segment(trimmed));
    }

    if output_root == workspace_root {
        output_root.push("outputs");
    }

    Ok(output_root)
}

fn build_output_base_name(tool_id: &str, preferred_name: &str) -> String {
    let preferred = sanitize_segment(strip_extension(preferred_name));
    let tool = sanitize_segment(tool_id);

    if preferred.is_empty() {
        return tool;
    }

    if preferred == tool {
        return preferred;
    }

    format!("{preferred}-{tool}")
}

fn sanitize_extension(value: &str) -> Result<String, AppError> {
    let sanitized = value.trim().trim_start_matches('.').to_ascii_lowercase();
    if sanitized.is_empty()
        || !sanitized.chars().all(|c| c.is_ascii_alphanumeric())
        || sanitized.len() > 16
    {
        return Err(AppError::Message(
            "Output extension is invalid.".to_string(),
        ));
    }

    Ok(sanitized)
}

fn strip_extension(file_name: &str) -> &str {
    match file_name.rfind('.') {
        Some(index) if index > 0 => &file_name[..index],
        _ => file_name,
    }
}

fn sanitize_segment(value: &str) -> String {
    let mut out = String::new();
    let mut last_dash = false;

    for ch in value.trim().chars() {
        let normalized = ch.to_ascii_lowercase();
        if normalized.is_ascii_alphanumeric() || normalized == '_' {
            out.push(normalized);
            last_dash = false;
            continue;
        }

        if normalized == '-' || normalized.is_ascii_whitespace() {
            if !last_dash && !out.is_empty() {
                out.push('-');
                last_dash = true;
            }
            continue;
        }

        if !last_dash && !out.is_empty() {
            out.push('-');
            last_dash = true;
        }
    }

    let sanitized = out.trim_matches('-');
    if sanitized.is_empty() {
        "output".to_string()
    } else {
        sanitized.to_string()
    }
}
