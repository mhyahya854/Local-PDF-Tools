import { isValidPageRanges } from "@/lib/pageRanges";
import type { ToolDefinition, ToolOptions } from "@/types/tools";

export interface ToolOptionValidationIssue {
  code: string;
  message: string;
}

export interface ToolOptionValidationResult {
  isValid: boolean;
  errors: ToolOptionValidationIssue[];
}

export function validateToolOptions(tool: ToolDefinition, options: ToolOptions): ToolOptionValidationResult {
  const errors: ToolOptionValidationIssue[] = [];

  if (tool.id === "split-pdf") {
    const mode = options.mode;

    if (mode === "every") {
      const everyNPages = typeof options.everyNPages === "number" ? options.everyNPages : Number(options.everyNPages);
      if (!Number.isInteger(everyNPages) || everyNPages < 1) {
        errors.push({
          code: "SPLIT_EVERY_INVALID",
          message: "Every N pages must be a whole number greater than zero.",
        });
      }
    } else {
      const ranges = typeof options.ranges === "string" ? options.ranges : "";
      if (!isValidPageRanges(ranges)) {
        errors.push({
          code: "SPLIT_RANGE_INVALID",
          message: 'Page ranges must use values like "1,3,5-8".',
        });
      }
    }
  }

  if (tool.id === "rotate-pdf") {
    const angle = typeof options.angle === "number" ? options.angle : Number(options.angle);
    if (![90, 180, 270].includes(angle)) {
      errors.push({
        code: "ROTATE_ANGLE_INVALID",
        message: "Rotate PDF supports 90, 180, or 270 degrees only.",
      });
    }
  }

  if (tool.id === "protect-pdf") {
    const userPassword = typeof options.userPassword === "string" ? options.userPassword.trim() : "";
    const ownerPassword = typeof options.ownerPassword === "string" ? options.ownerPassword.trim() : "";

    if (!userPassword || !ownerPassword) {
      errors.push({
        code: "PROTECT_PASSWORD_REQUIRED",
        message: "Protect PDF requires both user and owner passwords.",
      });
    }

    if (userPassword && ownerPassword && userPassword === ownerPassword) {
      errors.push({
        code: "PROTECT_PASSWORD_DISTINCT",
        message: "User and owner passwords must be different.",
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
