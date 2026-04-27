use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};

use serde_json::Value;

use crate::errors::{AppError, AppResult};

pub fn run(
    tool_id: &str,
    input_paths: &[String],
    output_file: &Path,
    scratch_dir: Option<&Path>,
    options: Option<&Value>,
) -> AppResult<Vec<PathBuf>> {
    if input_paths.is_empty() {
        return Err(AppError::Message(
            "qpdf: no input files were provided".to_string(),
        ));
    }

    if let Some(parent) = output_file.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)?;
        }
    }

    match tool_id {
        "merge-pdf" => run_merge(input_paths, output_file, options),
        "rotate-pdf" => run_rotate(tool_id, input_paths, output_file, options),
        "unlock-pdf" => run_unlock(tool_id, input_paths, output_file, scratch_dir, options),
        "protect-pdf" => run_protect(tool_id, input_paths, output_file, scratch_dir, options),
        "split-pdf" => run_split(input_paths, output_file, options),
        _ => Err(AppError::EngineNotImplemented(tool_id.to_string())),
    }
}

fn run_merge(
    input_paths: &[String],
    output_file: &Path,
    options: Option<&Value>,
) -> AppResult<Vec<PathBuf>> {
    let mut ordered_inputs = input_paths.to_vec();
    if options
        .and_then(|value| value.get("reverse"))
        .and_then(|value| value.as_bool())
        .unwrap_or(false)
    {
        ordered_inputs.reverse();
    }

    let mut command = Command::new("qpdf");
    command.arg("--empty").arg("--pages");
    for input in &ordered_inputs {
        command.arg(input);
    }
    command.arg("--").arg(output_file);

    run_command(&mut command, "merge")?;
    Ok(vec![output_file.to_path_buf()])
}

fn run_rotate(
    tool_id: &str,
    input_paths: &[String],
    output_file: &Path,
    options: Option<&Value>,
) -> AppResult<Vec<PathBuf>> {
    let angle = normalize_angle(
        options
            .and_then(|value| value.get("angle"))
            .and_then(|value| value.as_i64())
            .unwrap_or(90),
    )?;

    let mut outputs = Vec::new();
    for input_path in input_paths {
        let target = build_named_output(output_file, input_path, tool_id);

        let mut command = Command::new("qpdf");
        command
            .arg(input_path)
            .arg(format!("--rotate=+{angle}:1-z"))
            .arg(&target);

        run_command(&mut command, "rotate")?;
        outputs.push(target);
    }

    Ok(outputs)
}

fn run_unlock(
    tool_id: &str,
    input_paths: &[String],
    output_file: &Path,
    scratch_dir: Option<&Path>,
    options: Option<&Value>,
) -> AppResult<Vec<PathBuf>> {
    let password = options
        .and_then(|value| value.get("password"))
        .and_then(|value| value.as_str())
        .filter(|password| !password.is_empty())
        .map(ToString::to_string);

    let mut outputs = Vec::new();
    for input_path in input_paths {
        let target = build_named_output(output_file, input_path, tool_id);
        if let Some(password) = &password {
            run_command_with_args_file(
                &[
                    format!("--password={password}"),
                    "--decrypt".to_string(),
                    input_path.clone(),
                    target.to_string_lossy().to_string(),
                ],
                "unlock",
                scratch_dir,
            )?;
        } else {
            let mut command = Command::new("qpdf");
            command.arg("--decrypt").arg(input_path).arg(&target);
            run_command(&mut command, "unlock")?;
        }
        outputs.push(target);
    }

    Ok(outputs)
}

fn run_protect(
    tool_id: &str,
    input_paths: &[String],
    output_file: &Path,
    scratch_dir: Option<&Path>,
    options: Option<&Value>,
) -> AppResult<Vec<PathBuf>> {
    let user_password = options
        .and_then(|value| value.get("userPassword"))
        .and_then(|value| value.as_str())
        .unwrap_or("")
        .to_string();
    let owner_password = options
        .and_then(|value| value.get("ownerPassword"))
        .and_then(|value| value.as_str())
        .map(ToString::to_string)
        .unwrap_or_default();

    if user_password.is_empty() || owner_password.is_empty() {
        return Err(AppError::Message(
            "protect-pdf requires both a user password and an owner password.".to_string(),
        ));
    }

    if user_password == owner_password {
        return Err(AppError::Message(
            "protect-pdf requires different user and owner passwords.".to_string(),
        ));
    }

    let allow_print = options
        .and_then(|value| value.get("allowPrint"))
        .and_then(|value| value.as_bool())
        .unwrap_or(true);
    let allow_copy = options
        .and_then(|value| value.get("allowCopy"))
        .and_then(|value| value.as_bool())
        .unwrap_or(false);

    let mut outputs = Vec::new();
    for input_path in input_paths {
        let target = build_named_output(output_file, input_path, tool_id);
        run_command_with_args_file(
            &[
                "--encrypt".to_string(),
                user_password.clone(),
                owner_password.clone(),
                "256".to_string(),
                format!("--print={}", if allow_print { "full" } else { "none" }),
                format!("--extract={}", if allow_copy { "y" } else { "n" }),
                "--".to_string(),
                input_path.clone(),
                target.to_string_lossy().to_string(),
            ],
            "protect",
            scratch_dir,
        )?;
        outputs.push(target);
    }

    Ok(outputs)
}

fn run_split(
    input_paths: &[String],
    output_file: &Path,
    options: Option<&Value>,
) -> AppResult<Vec<PathBuf>> {
    if input_paths.len() != 1 {
        return Err(AppError::Message(
            "split-pdf requires a single input file".to_string(),
        ));
    }

    let mode = options
        .and_then(|value| value.get("mode"))
        .and_then(|value| value.as_str())
        .unwrap_or("range");

    if mode == "every" {
        return run_split_every(input_paths, output_file, options);
    }

    run_split_ranges(input_paths, output_file, options)
}

fn run_split_every(
    input_paths: &[String],
    output_file: &Path,
    options: Option<&Value>,
) -> AppResult<Vec<PathBuf>> {
    let every_n = options
        .and_then(|value| value.get("everyNPages"))
        .and_then(read_positive_u64)
        .unwrap_or(1);

    if every_n == 0 {
        return Err(AppError::Message(
            "split-pdf requires everyNPages to be greater than zero.".to_string(),
        ));
    }

    let mut command = Command::new("qpdf");
    command
        .arg(format!("--split-pages={every_n}"))
        .arg(&input_paths[0])
        .arg(output_file);

    run_command(&mut command, "split")?;
    collect_split_outputs(output_file)
}

fn run_split_ranges(
    input_paths: &[String],
    output_file: &Path,
    options: Option<&Value>,
) -> AppResult<Vec<PathBuf>> {
    let ranges = options
        .and_then(|value| value.get("ranges"))
        .and_then(|value| value.as_str())
        .or_else(|| {
            options
                .and_then(|value| value.get("pages"))
                .and_then(|value| value.as_str())
        })
        .unwrap_or("");

    let tokens = parse_range_tokens(ranges)?;
    let mut outputs = Vec::new();

    for (index, token) in tokens.iter().enumerate() {
        let target = append_suffix(
            output_file,
            &format!("part-{}-{}", index + 1, sanitize_token(token)),
        );

        let mut command = Command::new("qpdf");
        command
            .arg(&input_paths[0])
            .arg("--pages")
            .arg(&input_paths[0])
            .arg(token)
            .arg("--")
            .arg(&target);

        run_command(&mut command, "split")?;
        outputs.push(target);
    }

    Ok(outputs)
}

fn collect_split_outputs(output_file: &Path) -> AppResult<Vec<PathBuf>> {
    let parent = output_file.parent().ok_or_else(|| {
        AppError::Message("Split output path is missing a parent directory.".to_string())
    })?;
    let stem = output_file
        .file_stem()
        .map(|value| value.to_string_lossy().to_string())
        .ok_or_else(|| AppError::Message("Split output filename is invalid.".to_string()))?;
    let extension = output_file
        .extension()
        .map(|value| value.to_string_lossy().to_string());
    let prefix = format!("{stem}-");

    let mut outputs = Vec::new();
    for entry in fs::read_dir(parent)? {
        let entry = entry?;
        let path = entry.path();
        if !path.is_file() {
            continue;
        }

        let candidate_stem = path
            .file_stem()
            .map(|value| value.to_string_lossy().to_string())
            .unwrap_or_default();
        if !candidate_stem.starts_with(&prefix) {
            continue;
        }

        let extension_matches = match (&extension, path.extension()) {
            (Some(expected), Some(found)) => found.to_string_lossy().eq_ignore_ascii_case(expected),
            (None, None) => true,
            _ => false,
        };

        if extension_matches {
            outputs.push(path);
        }
    }

    outputs.sort();

    if outputs.is_empty() {
        return Err(AppError::Message(
            "qpdf split did not create any output files.".to_string(),
        ));
    }

    Ok(outputs)
}

fn append_suffix(output_file: &Path, suffix: &str) -> PathBuf {
    let parent = output_file.parent().unwrap_or_else(|| Path::new("."));
    let stem = output_file
        .file_stem()
        .map(|value| value.to_string_lossy().to_string())
        .unwrap_or_else(|| "output".to_string());
    let extension = output_file
        .extension()
        .map(|value| value.to_string_lossy().to_string());
    let cleaned_suffix = sanitize_token(suffix);

    match extension {
        Some(extension) => parent.join(format!("{stem}-{cleaned_suffix}.{extension}")),
        None => parent.join(format!("{stem}-{cleaned_suffix}")),
    }
}

fn build_named_output(output_file: &Path, input_path: &str, tool_id: &str) -> PathBuf {
    let parent = output_file.parent().unwrap_or_else(|| Path::new("."));
    let input_stem = Path::new(input_path)
        .file_stem()
        .map(|value| value.to_string_lossy().to_string())
        .unwrap_or_else(|| "output".to_string());
    let tool_segment = sanitize_token(tool_id);
    let extension = output_file
        .extension()
        .map(|value| value.to_string_lossy().to_string());

    match extension {
        Some(extension) => parent.join(format!(
            "{}-{}.{}",
            sanitize_token(&input_stem),
            tool_segment,
            extension
        )),
        None => parent.join(format!("{}-{}", sanitize_token(&input_stem), tool_segment)),
    }
}

fn normalize_angle(angle: i64) -> AppResult<i64> {
    let normalized = angle.rem_euclid(360);
    match normalized {
        90 | 180 | 270 => Ok(normalized),
        _ => Err(AppError::Message(
            "rotate-pdf only supports 90, 180, and 270 degree rotations.".to_string(),
        )),
    }
}

fn parse_range_tokens(input: &str) -> AppResult<Vec<String>> {
    let tokens: Vec<String> = input
        .split(',')
        .map(str::trim)
        .filter(|token| !token.is_empty())
        .map(ToString::to_string)
        .collect();

    if tokens.is_empty() {
        return Err(AppError::Message(
            "split-pdf requires at least one page range.".to_string(),
        ));
    }

    Ok(tokens)
}

fn sanitize_token(token: &str) -> String {
    let mut out = String::new();
    for ch in token.chars() {
        if ch.is_ascii_alphanumeric() {
            out.push(ch.to_ascii_lowercase());
        } else if matches!(ch, '-' | '_' | ',') && !out.ends_with('-') {
            out.push('-');
        }
    }

    let sanitized = out.trim_matches('-');
    if sanitized.is_empty() {
        "part".to_string()
    } else {
        sanitized.to_string()
    }
}

fn read_positive_u64(value: &Value) -> Option<u64> {
    value.as_u64().or_else(|| {
        value
            .as_i64()
            .and_then(|number| (number > 0).then_some(number as u64))
    })
}

fn run_command(command: &mut Command, action: &str) -> AppResult<()> {
    crate::process_runner::run_command(
        command,
        &format!("qpdf {action}"),
        crate::process_runner::ProcessLimits::engine(),
    )?;
    Ok(())
}

fn run_command_with_args_file(
    args: &[String],
    action: &str,
    scratch_dir: Option<&Path>,
) -> AppResult<()> {
    for arg in args {
        if arg.contains('\n') || arg.contains('\r') {
            return Err(AppError::Message(
                "Secure argument handling rejected an option containing a newline.".to_string(),
            ));
        }
    }

    let args_file = write_qpdf_args_file(args, action, scratch_dir)?;
    let mut command = Command::new("qpdf");
    command.arg(format!("@{}", args_file.to_string_lossy()));

    let run_result = run_command(&mut command, action);
    let _ = fs::remove_file(&args_file);
    run_result
}

fn write_qpdf_args_file(
    args: &[String],
    action: &str,
    scratch_dir: Option<&Path>,
) -> AppResult<PathBuf> {
    let mut dir = scratch_dir
        .map(Path::to_path_buf)
        .unwrap_or_else(std::env::temp_dir);
    if !dir.exists() {
        fs::create_dir_all(&dir)?;
    }

    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_nanos())
        .unwrap_or(0);
    let file_name = format!("qpdf-{action}-{}-{nonce}.args", std::process::id());
    dir.push(file_name);

    let mut options = fs::OpenOptions::new();
    options.write(true).create_new(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        options.mode(0o600);
    }
    let mut file = options.open(&dir)?;
    for arg in args {
        writeln!(file, "{arg}")?;
    }

    Ok(dir)
}
