use serde_json::Value;

use crate::tool_contract;

pub const REDACTED_SENTINEL: &str = "[REDACTED]";

pub fn sanitize_options_for_persistence(tool_id: &str, options: &Value) -> (Value, bool) {
    let mut sanitized = options.clone();
    let Some(object) = sanitized.as_object_mut() else {
        return (sanitized, false);
    };

    let mut changed = false;
    for key in tool_contract::sensitive_option_keys(tool_id) {
        changed |= redact_non_empty_string(object, key);
    }

    (sanitized, changed)
}

fn redact_non_empty_string(object: &mut serde_json::Map<String, Value>, key: &str) -> bool {
    if let Some(value) = object.get_mut(key) {
        let should_redact = value
            .as_str()
            .map(|candidate| !candidate.trim().is_empty() && candidate != REDACTED_SENTINEL)
            .unwrap_or(false);
        if should_redact {
            *value = Value::String(REDACTED_SENTINEL.to_string());
            return true;
        }
    }

    false
}
