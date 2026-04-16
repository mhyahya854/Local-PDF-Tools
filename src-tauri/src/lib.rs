mod commands;
mod engines;
mod errors;
mod types;
mod workspace;

use commands::jobs::{open_output_path, run_tool_job};
use commands::tools::{list_supported_engines, validate_files};

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            list_supported_engines,
            validate_files,
            run_tool_job,
            open_output_path
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
