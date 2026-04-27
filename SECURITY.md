# Security

## Supported Execution Model

PDF Powerhouse processes local files only in the Tauri desktop runtime. Browser preview mode cannot execute jobs.

## Secrets

PDF passwords are sensitive. The renderer may hold passwords temporarily for the active form submission, but persisted state is redacted by the backend before writing job records.

Backend redaction lives in `src-tauri/src/redaction.rs`. Do not add separate persistence redaction logic elsewhere.

## Subprocesses

Engine subprocesses must use `src-tauri/src/process_runner.rs` so they have:

- timeout handling
- stdout/stderr capture
- output truncation
- structured error reporting

Do not log command lines containing password values. qpdf password operations use temporary argument files and remove them immediately after execution.

## Local State

Job records live under the app workspace state directory. Corrupted job records are surfaced as failed recovery entries instead of disappearing silently.

Failed job temp workspaces may be retained for diagnostics. They can contain local file material, so retention and cleanup policy should remain conservative and visible to users.
