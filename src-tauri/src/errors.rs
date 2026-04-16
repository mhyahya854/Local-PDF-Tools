use thiserror::Error;

pub type AppResult<T> = Result<T, AppError>;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("{0}")]
    Message(String),
    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),
}

impl AppError {
    pub fn user_message(&self) -> String {
        match self {
            Self::Message(message) => message.clone(),
            Self::Io(error) => format!("Local file operation failed: {error}"),
        }
    }
}
