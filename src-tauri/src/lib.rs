mod commands;
mod engines;
mod engine_registry;
mod errors;
mod types;
mod workspace;

use commands::jobs::{open_output_path, run_tool_job};
use commands::tools::{list_supported_engines, validate_files, cleanup_tmp, list_persisted_jobs};

pub fn run() {
    // spawn a background cleanup of stale temporary workspaces so startup is tidy
    std::thread::spawn(|| {
        let _ = workspace::cleanup_stale_tmp(60 * 60 * 24 * 7);
    });

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            list_supported_engines,
            validate_files,
            cleanup_tmp,
            list_persisted_jobs,
            run_tool_job,
            open_output_path
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
