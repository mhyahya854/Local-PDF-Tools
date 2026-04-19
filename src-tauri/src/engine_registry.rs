use std::process::Command;

pub struct EngineInfo {
    pub key: &'static str,
    pub label: &'static str,
    pub available: bool,
    pub notes: String,
    pub supports_batch: bool,
    pub supports_password_protected_files: bool,
    pub supports_ocr: bool,
    pub requires_external_binary: bool,
}

fn probe_command(cmds: &[&str], args: &[&str]) -> Result<String, String> {
    for cmd in cmds {
        let out = Command::new(cmd).args(args).output();
        match out {
            Ok(output) => {
                // consider any stdout/stderr output as informative
                let stdout = String::from_utf8_lossy(&output.stdout).to_string();
                let stderr = String::from_utf8_lossy(&output.stderr).to_string();
                if !stdout.trim().is_empty() {
                    return Ok(stdout.trim().to_string());
                }
                if !stderr.trim().is_empty() {
                    return Ok(stderr.trim().to_string());
                }
                // If the command ran but produced no output, treat as success with empty note
                if output.status.success() {
                    return Ok(String::new());
                }
            }
            Err(_) => continue,
        }
    }

    Err("not found".to_string())
}

pub fn list_registered_engines() -> Vec<EngineInfo> {
    let mut engines: Vec<EngineInfo> = Vec::new();

    // qpdf
    match probe_command(&["qpdf"], &["--version"]) {
        Ok(s) => engines.push(EngineInfo { key: "qpdf", label: "qpdf", available: true, notes: format!("Detected: {}", s), supports_batch: true, supports_password_protected_files: true, supports_ocr: false, requires_external_binary: true }),
        Err(e) => engines.push(EngineInfo { key: "qpdf", label: "qpdf", available: false, notes: format!("Not detected: {}", e), supports_batch: true, supports_password_protected_files: true, supports_ocr: false, requires_external_binary: true }),
    }

    // LibreOffice
    match probe_command(&["soffice", "libreoffice"], &["--version"]) {
        Ok(s) => engines.push(EngineInfo { key: "libreoffice", label: "LibreOffice Headless", available: true, notes: format!("Detected: {}", s), supports_batch: true, supports_password_protected_files: false, supports_ocr: false, requires_external_binary: true }),
        Err(e) => engines.push(EngineInfo { key: "libreoffice", label: "LibreOffice Headless", available: false, notes: format!("Not detected: {}", e), supports_batch: true, supports_password_protected_files: false, supports_ocr: false, requires_external_binary: true }),
    }

    // Render engines (try mutool then pdftoppm)
    match probe_command(&["mutool", "pdftoppm"], &["-v"]) {
        Ok(s) => engines.push(EngineInfo { key: "render", label: "MuPDF/PDFium Render", available: true, notes: format!("Detected: {}", s), supports_batch: true, supports_password_protected_files: false, supports_ocr: false, requires_external_binary: true }),
        Err(e) => engines.push(EngineInfo { key: "render", label: "MuPDF/PDFium Render", available: false, notes: format!("Not detected: {}", e), supports_batch: true, supports_password_protected_files: false, supports_ocr: false, requires_external_binary: true }),
    }

    // OCRmyPDF
    match probe_command(&["ocrmypdf"], &["--version"]) {
        Ok(s) => engines.push(EngineInfo { key: "ocrmypdf", label: "OCRmyPDF + Tesseract", available: true, notes: format!("Detected: {}", s), supports_batch: true, supports_password_protected_files: false, supports_ocr: true, requires_external_binary: true }),
        Err(e) => engines.push(EngineInfo { key: "ocrmypdf", label: "OCRmyPDF + Tesseract", available: false, notes: format!("Not detected: {}", e), supports_batch: true, supports_password_protected_files: false, supports_ocr: true, requires_external_binary: true }),
    }

    // HTML local renderer - not implemented yet
    engines.push(EngineInfo { key: "html-local", label: "Local HTML Renderer", available: false, notes: "Local HTML renderer not implemented yet".to_string(), supports_batch: false, supports_password_protected_files: false, supports_ocr: false, requires_external_binary: false });

    // Watermark pipeline - implemented in Rust, no external binary required
    engines.push(EngineInfo { key: "watermark-pipeline", label: "Overlay Pipeline", available: true, notes: "Built-in overlay pipeline".to_string(), supports_batch: true, supports_password_protected_files: false, supports_ocr: false, requires_external_binary: false });

    // Ghostscript
    match probe_command(&["gs", "gswin64c", "gswin32c"], &["--version"]) {
        Ok(s) => engines.push(EngineInfo { key: "ghostscript", label: "Ghostscript", available: true, notes: format!("Detected: {}", s), supports_batch: true, supports_password_protected_files: false, supports_ocr: false, requires_external_binary: true }),
        Err(e) => engines.push(EngineInfo { key: "ghostscript", label: "Ghostscript", available: false, notes: format!("Not detected: {}", e), supports_batch: true, supports_password_protected_files: false, supports_ocr: false, requires_external_binary: true }),
    }

    engines
}
