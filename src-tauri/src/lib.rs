mod commands;
mod engine_registry;
mod engines;
mod errors;
mod process_runner;
mod redaction;
mod tool_contract;
mod types;
mod workspace;

use commands::jobs::{open_output_path, run_tool_job};
use commands::tools::{
    cleanup_tmp, get_runtime_diagnostics, list_persisted_jobs, list_supported_engines,
    list_tool_capabilities,
};

pub fn run() {
    std::thread::spawn(|| {
        let _ = workspace::cleanup_stale_tmp(60 * 60 * 24 * 7);
    });

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            list_supported_engines,
            list_tool_capabilities,
            get_runtime_diagnostics,
            cleanup_tmp,
            list_persisted_jobs,
            run_tool_job,
            open_output_path
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
