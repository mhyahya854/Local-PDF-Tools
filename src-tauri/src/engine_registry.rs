pub struct EngineInfo {
    pub key: &'static str,
    pub label: &'static str,
    pub installed: bool,
    pub implemented: bool,
    pub notes: Vec<String>,
    pub supports_batch: bool,
    pub supports_password_protected_files: bool,
    pub supports_ocr: bool,
    pub requires_external_binary: bool,
}

impl EngineInfo {
    pub fn runnable(&self) -> bool {
        self.installed && self.implemented
    }
}

fn probe_command(commands: &[&str], args: &[&str]) -> Result<String, String> {
    for command in commands {
        let result = crate::process_runner::run_process(
            command,
            args,
            crate::process_runner::ProcessLimits::probe(),
        );
        match result {
            Ok(output) => {
                let stdout = output.stdout.trim().to_string();
                let stderr = output.stderr.trim().to_string();
                return Ok(if !stdout.is_empty() { stdout } else { stderr });
            }
            Err(_) => continue,
        }
    }

    Err("not found".to_string())
}

fn notes(parts: &[String]) -> Vec<String> {
    parts
        .iter()
        .filter(|part| !part.is_empty())
        .cloned()
        .collect()
}

fn detected_note(output: String) -> String {
    if output.is_empty() {
        "Detected".to_string()
    } else {
        format!("Detected: {output}")
    }
}

pub fn list_registered_engines() -> Vec<EngineInfo> {
    let mut engines = Vec::new();

    match probe_command(&["qpdf"], &["--version"]) {
        Ok(output) => engines.push(EngineInfo {
            key: "qpdf",
            label: "qpdf",
            installed: true,
            implemented: true,
            notes: notes(&[detected_note(output)]),
            supports_batch: true,
            supports_password_protected_files: true,
            supports_ocr: false,
            requires_external_binary: true,
        }),
        Err(error) => engines.push(EngineInfo {
            key: "qpdf",
            label: "qpdf",
            installed: false,
            implemented: true,
            notes: notes(&[format!("Not detected: {error}")]),
            supports_batch: true,
            supports_password_protected_files: true,
            supports_ocr: false,
            requires_external_binary: true,
        }),
    }

    match probe_command(&["soffice", "libreoffice"], &["--version"]) {
        Ok(output) => engines.push(EngineInfo {
            key: "libreoffice",
            label: "LibreOffice Headless",
            installed: true,
            implemented: false,
            notes: notes(&[
                detected_note(output),
                "Adapter is not implemented in this release.".to_string(),
            ]),
            supports_batch: true,
            supports_password_protected_files: false,
            supports_ocr: false,
            requires_external_binary: true,
        }),
        Err(error) => engines.push(EngineInfo {
            key: "libreoffice",
            label: "LibreOffice Headless",
            installed: false,
            implemented: false,
            notes: notes(&[
                format!("Not detected: {error}"),
                "Adapter is not implemented in this release.".to_string(),
            ]),
            supports_batch: true,
            supports_password_protected_files: false,
            supports_ocr: false,
            requires_external_binary: true,
        }),
    }

    match probe_command(&["mutool", "pdftoppm"], &["-v"]) {
        Ok(output) => engines.push(EngineInfo {
            key: "render",
            label: "MuPDF/PDFium Render",
            installed: true,
            implemented: false,
            notes: notes(&[
                detected_note(output),
                "Adapter is not implemented in this release.".to_string(),
            ]),
            supports_batch: true,
            supports_password_protected_files: false,
            supports_ocr: false,
            requires_external_binary: true,
        }),
        Err(error) => engines.push(EngineInfo {
            key: "render",
            label: "MuPDF/PDFium Render",
            installed: false,
            implemented: false,
            notes: notes(&[
                format!("Not detected: {error}"),
                "Adapter is not implemented in this release.".to_string(),
            ]),
            supports_batch: true,
            supports_password_protected_files: false,
            supports_ocr: false,
            requires_external_binary: true,
        }),
    }

    match probe_command(&["ocrmypdf"], &["--version"]) {
        Ok(output) => engines.push(EngineInfo {
            key: "ocrmypdf",
            label: "OCRmyPDF + Tesseract",
            installed: true,
            implemented: false,
            notes: notes(&[
                detected_note(output),
                "Adapter is not implemented in this release.".to_string(),
            ]),
            supports_batch: true,
            supports_password_protected_files: false,
            supports_ocr: true,
            requires_external_binary: true,
        }),
        Err(error) => engines.push(EngineInfo {
            key: "ocrmypdf",
            label: "OCRmyPDF + Tesseract",
            installed: false,
            implemented: false,
            notes: notes(&[
                format!("Not detected: {error}"),
                "Adapter is not implemented in this release.".to_string(),
            ]),
            supports_batch: true,
            supports_password_protected_files: false,
            supports_ocr: true,
            requires_external_binary: true,
        }),
    }

    engines.push(EngineInfo {
        key: "html-local",
        label: "Local HTML Renderer",
        installed: true,
        implemented: false,
        notes: notes(&["Adapter is not implemented in this release.".to_string()]),
        supports_batch: false,
        supports_password_protected_files: false,
        supports_ocr: false,
        requires_external_binary: false,
    });

    engines.push(EngineInfo {
        key: "watermark-pipeline",
        label: "Overlay Pipeline",
        installed: true,
        implemented: false,
        notes: notes(&["Adapter is not implemented in this release.".to_string()]),
        supports_batch: true,
        supports_password_protected_files: false,
        supports_ocr: false,
        requires_external_binary: false,
    });

    match probe_command(&["gs", "gswin64c", "gswin32c"], &["--version"]) {
        Ok(output) => engines.push(EngineInfo {
            key: "ghostscript",
            label: "Ghostscript",
            installed: true,
            implemented: false,
            notes: notes(&[
                detected_note(output),
                "Adapter is not implemented in this release.".to_string(),
            ]),
            supports_batch: true,
            supports_password_protected_files: false,
            supports_ocr: false,
            requires_external_binary: true,
        }),
        Err(error) => engines.push(EngineInfo {
            key: "ghostscript",
            label: "Ghostscript",
            installed: false,
            implemented: false,
            notes: notes(&[
                format!("Not detected: {error}"),
                "Adapter is not implemented in this release.".to_string(),
            ]),
            supports_batch: true,
            supports_password_protected_files: false,
            supports_ocr: false,
            requires_external_binary: true,
        }),
    }

    engines
}

pub fn is_engine_available(engine_key: &str) -> bool {
    list_registered_engines()
        .into_iter()
        .find(|engine| engine.key == engine_key)
        .map(|engine| engine.runnable())
        .unwrap_or(false)
}
