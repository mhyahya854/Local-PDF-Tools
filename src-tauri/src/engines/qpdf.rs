use std::path::Path;
use std::process::Command;

use serde_json::Value;

use crate::errors::AppResult;

pub fn run(tool_id: &str, file_names: &[String], output_file: &Path, options: Option<&Value>) -> AppResult<()> {
    if file_names.is_empty() {
        return Err(crate::errors::AppError::Message("qpdf: no input files provided".to_string()));
    }

    if let Some(parent) = output_file.parent() {
        if !parent.exists() {
            std::fs::create_dir_all(parent)?;
        }
    }

    let output_str = output_file.to_string_lossy().to_string();

    match tool_id {
        "merge-pdf" => {
            // qpdf --empty --pages file1 file2 -- out.pdf
            let mut cmd = Command::new("qpdf");
            cmd.arg("--empty").arg("--pages");
            for f in file_names {
                cmd.arg(f);
            }
            cmd.arg("--").arg(&output_str);

            let out = cmd.output()?;
            if !out.status.success() {
                return Err(crate::errors::AppError::Message(format!("qpdf merge failed: {}", String::from_utf8_lossy(&out.stderr))));
            }
            Ok(())
        }
        "rotate-pdf" => {
            if file_names.len() != 1 {
                return Err(crate::errors::AppError::Message("rotate-pdf requires a single input file".to_string()));
            }

            let angle = options
                .and_then(|v| v.get("angle"))
                .and_then(|a| a.as_i64())
                .unwrap_or(90);

            // qpdf infile --rotate=+<angle>:1-z outfile
            let mut cmd = Command::new("qpdf");
            cmd.arg(&file_names[0])
                .arg(format!("--rotate=+{}:1-z", angle))
                .arg(&output_str);

            let out = cmd.output()?;
            if !out.status.success() {
                return Err(crate::errors::AppError::Message(format!("qpdf rotate failed: {}", String::from_utf8_lossy(&out.stderr))));
            }

            Ok(())
        }
        "unlock-pdf" => {
            if file_names.len() != 1 {
                return Err(crate::errors::AppError::Message("unlock-pdf requires a single input file".to_string()));
            }

            let mut cmd = Command::new("qpdf");
            if let Some(opts) = options {
                if let Some(pw) = opts.get("password").and_then(|p| p.as_str()) {
                    cmd.arg(format!("--password={}", pw));
                }
            }
            cmd.arg("--decrypt").arg(&file_names[0]).arg(&output_str);

            let out = cmd.output()?;
            if !out.status.success() {
                return Err(crate::errors::AppError::Message(format!("qpdf unlock failed: {}", String::from_utf8_lossy(&out.stderr))));
            }

            Ok(())
        }
        "protect-pdf" => {
            if file_names.len() != 1 {
                return Err(crate::errors::AppError::Message("protect-pdf requires a single input file".to_string()));
            }

            let password = options
                .and_then(|v| v.get("password"))
                .and_then(|p| p.as_str())
                .map(|s| s.to_string());

            let password = match password {
                Some(p) => p,
                None => return Err(crate::errors::AppError::Message("protect-pdf requires a 'password' option".to_string())),
            };

            // qpdf --encrypt user-password owner-password 256 -- infile outfile
            let mut cmd = Command::new("qpdf");
            cmd.arg("--encrypt")
                .arg(&password)
                .arg(&password)
                .arg("256")
                .arg("--")
                .arg(&file_names[0])
                .arg(&output_str);

            let out = cmd.output()?;
            if !out.status.success() {
                return Err(crate::errors::AppError::Message(format!("qpdf protect failed: {}", String::from_utf8_lossy(&out.stderr))));
            }

            Ok(())
        }
        "split-pdf" => {
            // Support extracting a specific page range via options.pages (e.g. "1-3")
            if file_names.len() != 1 {
                return Err(crate::errors::AppError::Message("split-pdf requires a single input file".to_string()));
            }

            let pages = options.and_then(|v| v.get("pages")).and_then(|p| p.as_str());
            let pages = match pages {
                Some(p) => p,
                None => return Err(crate::errors::AppError::Message("split-pdf requires an option 'pages' with a page range".to_string())),
            };

            // qpdf infile --pages infile <pages> -- outfile
            let mut cmd = Command::new("qpdf");
            cmd.arg(&file_names[0])
                .arg("--pages")
                .arg(&file_names[0])
                .arg(pages)
                .arg("--")
                .arg(&output_str);

            let out = cmd.output()?;
            if !out.status.success() {
                return Err(crate::errors::AppError::Message(format!("qpdf split/extract failed: {}", String::from_utf8_lossy(&out.stderr))));
            }

            Ok(())
        }
        _ => Err(crate::errors::AppError::EngineNotImplemented(tool_id.to_string())),
    }
}
