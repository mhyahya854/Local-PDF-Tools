use thiserror::Error;

pub type AppResult<T> = Result<T, AppError>;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("{0}")]
    Message(String),
    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Engine not implemented: {0}")]
    EngineNotImplemented(String),
    #[error("Tool not available on this platform: {0}")]
    ToolNotAvailableOnThisPlatform(String),
    #[error("Desktop-only feature: {0}")]
    DesktopOnlyFeature(String),
}

impl AppError {
    pub fn user_message(&self) -> String {
        match self {
            Self::Message(message) => message.clone(),
            Self::Io(error) => format!("Local file operation failed: {error}"),
            Self::EngineNotImplemented(tool) => format!("Engine not implemented for tool: {tool}"),
            Self::ToolNotAvailableOnThisPlatform(tool) => {
                format!("Tool not available on this platform: {tool}")
            }
            Self::DesktopOnlyFeature(feature) => format!("Desktop-only feature: {feature}"),
        }
    }
}
