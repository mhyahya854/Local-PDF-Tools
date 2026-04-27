# Architecture

PDF Powerhouse uses a React/Vite renderer and a Tauri/Rust backend.

## Product Boundary

The current supported release scope is qpdf-backed desktop execution only. Browser mode is a preview/runtime-diagnostics mode and cannot process files.

## Source Of Truth

Rust owns executable capability truth:

- `src-tauri/src/engine_registry.rs` reports engine `installed`, `implemented`, and `runnable`.
- `src-tauri/src/tool_contract.rs` defines runnable tool contracts and option keys.
- `list_tool_capabilities` exposes those contracts to the renderer.

TypeScript owns presentation metadata:

- labels
- icons
- category grouping
- user-facing descriptions
- form layout

TypeScript must not make a tool executable unless the backend capability says it is runnable.

## Execution

Jobs enter through `run_tool_job`, are validated against backend tool contracts, then dispatched to the engine adapter. qpdf commands use the shared `process_runner` for timeouts and bounded output capture.

Sensitive options are redacted by the backend before persistence through `src-tauri/src/redaction.rs`.
