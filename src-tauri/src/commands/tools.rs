use crate::types::{EngineAvailabilityResponse, ToolValidationResponse};

#[tauri::command]
pub fn list_supported_engines() -> Vec<EngineAvailabilityResponse> {
    vec![
        EngineAvailabilityResponse::new("qpdf", "qpdf", false, "Probe command not yet wired."),
        EngineAvailabilityResponse::new(
            "libreoffice",
            "LibreOffice Headless",
            false,
            "Probe command not yet wired.",
        ),
        EngineAvailabilityResponse::new(
            "render",
            "MuPDF/PDFium Render",
            false,
            "Probe command not yet wired.",
        ),
        EngineAvailabilityResponse::new(
            "ocrmypdf",
            "OCRmyPDF + Tesseract",
            false,
            "Probe command not yet wired.",
        ),
        EngineAvailabilityResponse::new(
            "html-local",
            "Local HTML Renderer",
            false,
            "Probe command not yet wired.",
        ),
        EngineAvailabilityResponse::new(
            "watermark-pipeline",
            "Overlay Pipeline",
            false,
            "Probe command not yet wired.",
        ),
        EngineAvailabilityResponse::new(
            "ghostscript",
            "Ghostscript",
            false,
            "Probe command not yet wired.",
        ),
    ]
}

#[tauri::command]
pub fn validate_files(tool_id: String, file_names: Vec<String>) -> ToolValidationResponse {
    let mut issues = Vec::new();

    if file_names.is_empty() {
        issues.push("No input files were provided.".to_string());
    }

    if tool_id.trim().is_empty() {
        issues.push("Tool id is missing.".to_string());
    }

    ToolValidationResponse {
        ok: issues.is_empty(),
        issues,
    }
}
