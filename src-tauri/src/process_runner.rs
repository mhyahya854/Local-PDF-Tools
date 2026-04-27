use std::io::Read;
use std::process::{Child, Command, Stdio};
use std::thread::JoinHandle;
use std::time::{Duration, Instant};

use crate::errors::{AppError, AppResult};

pub struct ProcessLimits {
    pub timeout: Duration,
    pub output_limit_bytes: usize,
}

impl ProcessLimits {
    pub fn probe() -> Self {
        Self {
            timeout: Duration::from_secs(3),
            output_limit_bytes: 16 * 1024,
        }
    }

    pub fn engine() -> Self {
        Self {
            timeout: Duration::from_secs(120),
            output_limit_bytes: 128 * 1024,
        }
    }
}

pub struct ProcessOutput {
    pub stdout: String,
    pub stderr: String,
    pub exit_code: Option<i32>,
}

pub fn run_process(
    command: &str,
    args: &[&str],
    limits: ProcessLimits,
) -> AppResult<ProcessOutput> {
    let child = Command::new(command)
        .args(args)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()?;
    finish_process(child, command, limits)
}

pub fn run_command(
    command: &mut Command,
    action: &str,
    limits: ProcessLimits,
) -> AppResult<ProcessOutput> {
    command
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    let child = command.spawn()?;
    finish_process(child, action, limits)
}

struct CapturedOutput {
    bytes: Vec<u8>,
    truncated: bool,
}

fn finish_process(
    mut child: Child,
    action: &str,
    limits: ProcessLimits,
) -> AppResult<ProcessOutput> {
    let stdout_reader = spawn_output_reader(child.stdout.take(), limits.output_limit_bytes);
    let stderr_reader = spawn_output_reader(child.stderr.take(), limits.output_limit_bytes);
    let start = Instant::now();

    let status = loop {
        if let Some(status) = child.try_wait()? {
            break Some(status);
        }

        if start.elapsed() > limits.timeout {
            let _ = child.kill();
            let _ = child.wait();
            break None;
        }

        std::thread::sleep(Duration::from_millis(25));
    };

    let stdout = collect_output(stdout_reader)?;
    let stderr = collect_output(stderr_reader)?;

    match status {
        Some(status) => {
            let output = ProcessOutput {
                stdout,
                stderr,
                exit_code: status.code(),
            };

            if status.success() {
                Ok(output)
            } else {
                Err(AppError::ProcessFailed {
                    command: action.to_string(),
                    exit_code: output.exit_code,
                    stderr: output.stderr,
                })
            }
        }
        None => Err(AppError::ProcessTimedOut {
            command: action.to_string(),
            timeout_ms: limits.timeout.as_millis(),
        }),
    }
}

fn spawn_output_reader<R>(
    reader: Option<R>,
    limit: usize,
) -> Option<JoinHandle<std::io::Result<CapturedOutput>>>
where
    R: Read + Send + 'static,
{
    reader.map(|reader| std::thread::spawn(move || read_capped(reader, limit)))
}

fn collect_output(
    handle: Option<JoinHandle<std::io::Result<CapturedOutput>>>,
) -> AppResult<String> {
    let Some(handle) = handle else {
        return Ok(String::new());
    };

    let captured = handle
        .join()
        .map_err(|_| AppError::Message("Process output reader thread panicked.".to_string()))??;

    Ok(decode_capped(captured))
}

fn read_capped(mut reader: impl Read, limit: usize) -> std::io::Result<CapturedOutput> {
    let mut bytes = Vec::new();
    let mut buffer = [0_u8; 4096];
    let mut truncated = false;

    loop {
        let read = reader.read(&mut buffer)?;
        if read == 0 {
            break;
        }

        if bytes.len() < limit {
            let remaining = limit - bytes.len();
            let to_copy = remaining.min(read);
            bytes.extend_from_slice(&buffer[..to_copy]);
            if to_copy < read {
                truncated = true;
            }
        } else {
            truncated = true;
        }
    }

    Ok(CapturedOutput { bytes, truncated })
}

fn decode_capped(captured: CapturedOutput) -> String {
    let mut output = String::from_utf8_lossy(&captured.bytes).to_string();
    if captured.truncated {
        output.push_str("\n[output truncated]");
    }
    output
}
