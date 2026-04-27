use thiserror::Error;

pub type AppResult<T> = Result<T, AppError>;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("{0}")]
    Message(String),
    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),
    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),
    #[error("Engine not implemented: {0}")]
    EngineNotImplemented(String),
    #[error("Tool not available on this platform: {0}")]
    ToolNotAvailableOnThisPlatform(String),
    #[error("Desktop-only feature: {0}")]
    DesktopOnlyFeature(String),
    #[error("Process timed out: {command}")]
    ProcessTimedOut { command: String, timeout_ms: u128 },
    #[error("Process failed: {command}")]
    ProcessFailed {
        command: String,
        exit_code: Option<i32>,
        stderr: String,
    },
}

impl AppError {
    pub fn user_message(&self) -> String {
        match self {
            Self::Message(message) => message.clone(),
            Self::Io(error) => format!("Local file operation failed: {error}"),
            Self::Json(error) => format!("Local state serialization failed: {error}"),
            Self::EngineNotImplemented(tool) => format!("Engine not implemented for tool: {tool}"),
            Self::ToolNotAvailableOnThisPlatform(tool) => {
                format!("Tool not available on this platform: {tool}")
            }
            Self::DesktopOnlyFeature(feature) => format!("Desktop-only feature: {feature}"),
            Self::ProcessTimedOut {
                command,
                timeout_ms,
            } => {
                format!("{command} timed out after {timeout_ms} ms")
            }
            Self::ProcessFailed {
                command,
                exit_code,
                stderr,
            } => {
                let details = if stderr.trim().is_empty() {
                    exit_code
                        .map(|code| format!("exit code {code}"))
                        .unwrap_or_else(|| "no exit code".to_string())
                } else {
                    stderr.trim().to_string()
                };
                format!("{command} failed: {details}")
            }
        }
    }
}
