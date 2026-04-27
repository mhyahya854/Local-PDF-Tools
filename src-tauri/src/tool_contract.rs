use serde_json::Value;

use crate::errors::{AppError, AppResult};
use crate::types::{ToolCapabilityResponse, ToolExecutionRequest};

#[derive(Clone, Copy)]
pub struct ToolContract {
    tool_id: &'static str,
    engine_key: &'static str,
    input_extensions: &'static [&'static str],
    output_extension: &'static str,
    min_files: usize,
    max_files: Option<usize>,
    supports_batch: bool,
    supported_options: &'static [&'static str],
    sensitive_options: &'static [&'static str],
    output_strategy: &'static str,
    browser_preview: bool,
}

const QPDF_TOOLS: &[ToolContract] = &[
    ToolContract {
        tool_id: "merge-pdf",
        engine_key: "qpdf",
        input_extensions: &["pdf"],
        output_extension: "pdf",
        min_files: 2,
        max_files: None,
        supports_batch: true,
        supported_options: &["reverse"],
        sensitive_options: &[],
        output_strategy: "single-output",
        browser_preview: true,
    },
    ToolContract {
        tool_id: "split-pdf",
        engine_key: "qpdf",
        input_extensions: &["pdf"],
        output_extension: "pdf",
        min_files: 1,
        max_files: Some(1),
        supports_batch: false,
        supported_options: &["mode", "ranges", "everyNPages"],
        sensitive_options: &[],
        output_strategy: "range-or-page-chunks",
        browser_preview: true,
    },
    ToolContract {
        tool_id: "rotate-pdf",
        engine_key: "qpdf",
        input_extensions: &["pdf"],
        output_extension: "pdf",
        min_files: 1,
        max_files: None,
        supports_batch: true,
        supported_options: &["angle"],
        sensitive_options: &[],
        output_strategy: "one-output-per-input",
        browser_preview: true,
    },
    ToolContract {
        tool_id: "unlock-pdf",
        engine_key: "qpdf",
        input_extensions: &["pdf"],
        output_extension: "pdf",
        min_files: 1,
        max_files: None,
        supports_batch: true,
        supported_options: &["password"],
        sensitive_options: &["password"],
        output_strategy: "one-output-per-input",
        browser_preview: false,
    },
    ToolContract {
        tool_id: "protect-pdf",
        engine_key: "qpdf",
        input_extensions: &["pdf"],
        output_extension: "pdf",
        min_files: 1,
        max_files: None,
        supports_batch: true,
        supported_options: &["userPassword", "ownerPassword", "allowPrint", "allowCopy"],
        sensitive_options: &["userPassword", "ownerPassword"],
        output_strategy: "one-output-per-input",
        browser_preview: false,
    },
];

pub fn list_tool_capabilities(
    is_engine_runnable: impl Fn(&str) -> bool,
) -> Vec<ToolCapabilityResponse> {
    QPDF_TOOLS
        .iter()
        .map(|contract| {
            let runnable = is_engine_runnable(contract.engine_key);
            ToolCapabilityResponse {
                tool_id: contract.tool_id.to_string(),
                engine_key: contract.engine_key.to_string(),
                implemented: true,
                desktop_only: true,
                browser_preview: contract.browser_preview,
                runnable,
                input_extensions: contract
                    .input_extensions
                    .iter()
                    .map(|value| value.to_string())
                    .collect(),
                output_extension: contract.output_extension.to_string(),
                min_files: contract.min_files,
                max_files: contract.max_files,
                supports_batch: contract.supports_batch,
                supported_options: contract
                    .supported_options
                    .iter()
                    .map(|value| value.to_string())
                    .collect(),
                sensitive_options: contract
                    .sensitive_options
                    .iter()
                    .map(|value| value.to_string())
                    .collect(),
                output_strategy: contract.output_strategy.to_string(),
                notes: if runnable {
                    Vec::new()
                } else {
                    vec![format!("Requires runnable {} engine.", contract.engine_key)]
                },
            }
        })
        .collect()
}

pub fn sensitive_option_keys(tool_id: &str) -> &'static [&'static str] {
    contract_for_tool(tool_id)
        .map(|contract| contract.sensitive_options)
        .unwrap_or(&[])
}

pub fn validate_execution_request(
    request: &ToolExecutionRequest,
    is_engine_available: impl Fn(&str) -> bool,
) -> AppResult<()> {
    if request.tool_id.trim().is_empty() {
        return Err(AppError::Message("tool_id must not be empty".to_string()));
    }

    let contract = contract_for_tool(&request.tool_id).ok_or_else(|| {
        AppError::EngineNotImplemented(format!(
            "{} is not executable in this build.",
            request.tool_id
        ))
    })?;

    if !is_engine_available(contract.engine_key) {
        return Err(AppError::ToolNotAvailableOnThisPlatform(format!(
            "{} requires {} but it is unavailable.",
            request.tool_id, contract.engine_key
        )));
    }

    if request.input_files.len() < contract.min_files {
        return Err(AppError::Message(format!(
            "{} requires at least {} input file(s).",
            request.tool_id, contract.min_files
        )));
    }

    if let Some(max_files) = contract.max_files {
        if request.input_files.len() > max_files {
            return Err(AppError::Message(format!(
                "{} supports at most {} input file(s).",
                request.tool_id, max_files
            )));
        }
    }

    if !contract.supports_batch && request.input_files.len() > 1 {
        return Err(AppError::Message(format!(
            "{} currently supports one input file at a time.",
            request.tool_id
        )));
    }

    let output_extension = request.output_extension.trim().trim_start_matches('.');
    if !output_extension.eq_ignore_ascii_case(contract.output_extension) {
        return Err(AppError::Message(format!(
            "{} must output .{} files.",
            request.tool_id, contract.output_extension
        )));
    }

    for input in &request.input_files {
        if input.name.trim().is_empty() {
            return Err(AppError::Message(
                "Each input file must include a non-empty name.".to_string(),
            ));
        }

        let extension = extension_from_name(&input.name).ok_or_else(|| {
            AppError::Message(format!(
                "Input file {} is missing a file extension.",
                input.name
            ))
        })?;

        if !contract
            .input_extensions
            .iter()
            .any(|allowed| extension.eq_ignore_ascii_case(allowed))
        {
            return Err(AppError::Message(format!(
                "Input file {} has unsupported extension .{} for {}.",
                input.name, extension, request.tool_id
            )));
        }
    }

    validate_tool_options(contract.tool_id, &request.options)?;

    Ok(())
}

fn contract_for_tool(tool_id: &str) -> Option<ToolContract> {
    QPDF_TOOLS
        .iter()
        .copied()
        .find(|tool| tool.tool_id == tool_id)
}

fn extension_from_name(name: &str) -> Option<&str> {
    let trimmed = name.trim();
    let split_index = trimmed.rfind('.')?;
    (split_index > 0 && split_index < trimmed.len() - 1).then_some(&trimmed[split_index + 1..])
}

fn validate_tool_options(tool_id: &str, options: &Value) -> AppResult<()> {
    let object = options
        .as_object()
        .ok_or_else(|| AppError::Message(format!("{tool_id} options must be a JSON object.")))?;

    match tool_id {
        "merge-pdf" => {
            validate_allowed_keys(tool_id, object, &["reverse"])?;
            if let Some(value) = object.get("reverse") {
                ensure_boolean(tool_id, "reverse", value)?;
            }
        }
        "split-pdf" => {
            validate_allowed_keys(tool_id, object, &["mode", "ranges", "everyNPages"])?;
            let mode = object
                .get("mode")
                .and_then(Value::as_str)
                .unwrap_or("range")
                .trim();

            if mode != "range" && mode != "every" {
                return Err(AppError::Message(
                    "split-pdf mode must be either \"range\" or \"every\".".to_string(),
                ));
            }

            if mode == "every" {
                let every = object
                    .get("everyNPages")
                    .ok_or_else(|| {
                        AppError::Message(
                            "split-pdf requires everyNPages when mode is \"every\".".to_string(),
                        )
                    })
                    .and_then(positive_integer)?;
                if every == 0 {
                    return Err(AppError::Message(
                        "split-pdf everyNPages must be greater than zero.".to_string(),
                    ));
                }
            } else {
                let ranges = object
                    .get("ranges")
                    .and_then(Value::as_str)
                    .map(str::trim)
                    .ok_or_else(|| {
                        AppError::Message(
                            "split-pdf requires a ranges value when mode is \"range\".".to_string(),
                        )
                    })?;
                validate_page_ranges(ranges)?;
            }
        }
        "rotate-pdf" => {
            validate_allowed_keys(tool_id, object, &["angle"])?;
            if let Some(value) = object.get("angle") {
                let angle = integer(value)?;
                if !matches!(angle.rem_euclid(360), 90 | 180 | 270) {
                    return Err(AppError::Message(
                        "rotate-pdf only supports 90, 180, or 270 degrees.".to_string(),
                    ));
                }
            }
        }
        "unlock-pdf" => {
            validate_allowed_keys(tool_id, object, &["password"])?;
            if let Some(value) = object.get("password") {
                ensure_string(tool_id, "password", value)?;
            }
        }
        "protect-pdf" => {
            validate_allowed_keys(
                tool_id,
                object,
                &["userPassword", "ownerPassword", "allowPrint", "allowCopy"],
            )?;

            let user = object
                .get("userPassword")
                .and_then(Value::as_str)
                .map(str::trim)
                .unwrap_or("");
            let owner = object
                .get("ownerPassword")
                .and_then(Value::as_str)
                .map(str::trim)
                .unwrap_or("");

            if user.is_empty() || owner.is_empty() {
                return Err(AppError::Message(
                    "protect-pdf requires both userPassword and ownerPassword.".to_string(),
                ));
            }

            if user == owner {
                return Err(AppError::Message(
                    "protect-pdf userPassword and ownerPassword must be different.".to_string(),
                ));
            }

            if let Some(value) = object.get("allowPrint") {
                ensure_boolean(tool_id, "allowPrint", value)?;
            }
            if let Some(value) = object.get("allowCopy") {
                ensure_boolean(tool_id, "allowCopy", value)?;
            }
        }
        _ => {
            return Err(AppError::EngineNotImplemented(tool_id.to_string()));
        }
    }

    Ok(())
}

fn validate_allowed_keys(
    tool_id: &str,
    object: &serde_json::Map<String, Value>,
    allowed_keys: &[&str],
) -> AppResult<()> {
    for key in object.keys() {
        if !allowed_keys.iter().any(|allowed| *allowed == key) {
            return Err(AppError::Message(format!(
                "{tool_id} does not support option key \"{key}\"."
            )));
        }
    }
    Ok(())
}

fn ensure_boolean(tool_id: &str, key: &str, value: &Value) -> AppResult<()> {
    if value.is_boolean() {
        Ok(())
    } else {
        Err(AppError::Message(format!(
            "{tool_id} option {key} must be a boolean value."
        )))
    }
}

fn ensure_string(tool_id: &str, key: &str, value: &Value) -> AppResult<()> {
    if value.is_string() {
        Ok(())
    } else {
        Err(AppError::Message(format!(
            "{tool_id} option {key} must be a string value."
        )))
    }
}

fn integer(value: &Value) -> AppResult<i64> {
    value
        .as_i64()
        .ok_or_else(|| AppError::Message("Expected an integer value.".to_string()))
}

fn positive_integer(value: &Value) -> AppResult<u64> {
    if let Some(number) = value.as_u64() {
        return Ok(number);
    }

    if let Some(number) = value.as_i64() {
        if number > 0 {
            return Ok(number as u64);
        }
    }

    Err(AppError::Message(
        "Expected a positive integer value.".to_string(),
    ))
}

fn validate_page_ranges(ranges: &str) -> AppResult<()> {
    let tokens: Vec<&str> = ranges
        .split(',')
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .collect();

    if tokens.is_empty() {
        return Err(AppError::Message(
            "split-pdf ranges must include at least one page token.".to_string(),
        ));
    }

    for token in tokens {
        if token == "z" {
            continue;
        }

        if let Some((start, end)) = token.split_once('-') {
            let start_value = validate_page_bound(start, "range start")?;
            let end_value = validate_page_bound(end, "range end")?;
            if let (Some(start_page), Some(end_page)) = (start_value, end_value) {
                if start_page > end_page {
                    return Err(AppError::Message(format!(
                        "split-pdf range start must not exceed range end in token: {token}"
                    )));
                }
            }
            continue;
        }

        let _ = validate_page_bound(token, "page number")?;
    }

    Ok(())
}

fn validate_page_bound(value: &str, label: &str) -> AppResult<Option<u64>> {
    let trimmed = value.trim();
    if trimmed.eq_ignore_ascii_case("z") {
        return Ok(None);
    }

    let page = trimmed
        .parse::<u64>()
        .map_err(|_| AppError::Message(format!("split-pdf {label} is invalid: {trimmed}")))?;

    if page == 0 {
        return Err(AppError::Message(format!(
            "split-pdf {label} must be greater than zero."
        )));
    }

    Ok(Some(page))
}

#[cfg(test)]
mod tests {
    use super::validate_page_ranges;

    #[test]
    fn range_validation_accepts_basic_tokens() {
        assert!(validate_page_ranges("1,2-4,z").is_ok());
    }

    #[test]
    fn range_validation_rejects_empty_input() {
        assert!(validate_page_ranges(" , ").is_err());
    }
}
