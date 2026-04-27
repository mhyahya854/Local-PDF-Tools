import type { ToolOptions } from "@/types/tools";

export function redactJobOptionsForHistory(options: ToolOptions, sensitiveKeys: string[]): ToolOptions {
  if (sensitiveKeys.length === 0) {
    return { ...options };
  }

  const sanitized: ToolOptions = { ...options };
  for (const key of sensitiveKeys) {
    redactIfNonEmptyString(sanitized, key);
  }
  return sanitized;
}

function redactIfNonEmptyString(options: ToolOptions, key: string) {
  const candidate = options[key];
  if (typeof candidate === "string" && candidate.trim().length > 0) {
    options[key] = "[REDACTED]";
  }
}
