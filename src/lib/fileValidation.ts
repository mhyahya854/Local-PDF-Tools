import { getExtension } from "@/lib/utils";
import type { SelectedInputFile, ToolDefinition } from "@/types/tools";

export interface FileValidationIssue {
  code: string;
  message: string;
}

export interface FileValidationResult {
  isValid: boolean;
  errors: FileValidationIssue[];
  warnings: FileValidationIssue[];
  acceptedFiles: SelectedInputFile[];
  rejectedFiles: Array<{ file: SelectedInputFile; reason: string }>;
}

const DEFAULT_MAX_FILE_SIZE_MB = 500;

export function validateFilesForTool(files: SelectedInputFile[], tool: ToolDefinition): FileValidationResult {
  const errors: FileValidationIssue[] = [];
  const warnings: FileValidationIssue[] = [];
  const acceptedFiles: SelectedInputFile[] = [];
  const rejectedFiles: Array<{ file: SelectedInputFile; reason: string }> = [];

  if (files.length === 0) {
    errors.push({ code: "NO_FILES", message: "Select at least one file." });
  }

  if (tool.minFiles && files.length < tool.minFiles) {
    errors.push({
      code: "MIN_FILES",
      message: `This tool needs at least ${tool.minFiles} file${tool.minFiles === 1 ? "" : "s"}.`,
    });
  }

  if (tool.maxFiles && files.length > tool.maxFiles) {
    errors.push({
      code: "MAX_FILES",
      message: `This tool allows up to ${tool.maxFiles} file${tool.maxFiles === 1 ? "" : "s"}.`,
    });
  }

  if (!tool.supportsBatch && files.length > 1) {
    errors.push({
      code: "BATCH_NOT_SUPPORTED",
      message: "This tool currently supports one input file at a time.",
    });
  }

  const maxFileSizeBytes = (tool.maxFileSizeMb ?? DEFAULT_MAX_FILE_SIZE_MB) * 1024 * 1024;

  for (const file of files) {
    const ext = getExtension(file.name);

    if (!tool.inputExtensions.includes(ext)) {
      rejectedFiles.push({
        file,
        reason: `Unsupported extension .${ext || "unknown"}. Accepted: ${tool.inputExtensions.map((value) => `.${value}`).join(", ")}`,
      });
      continue;
    }

    if (file.source === "desktop" && !file.path) {
      rejectedFiles.push({
        file,
        reason: "Desktop selections must include a readable local file path.",
      });
      continue;
    }

    if (typeof file.sizeBytes === "number" && file.sizeBytes > maxFileSizeBytes) {
      rejectedFiles.push({
        file,
        reason: `File exceeds the ${tool.maxFileSizeMb ?? DEFAULT_MAX_FILE_SIZE_MB} MB limit for this tool.`,
      });
      continue;
    }

    acceptedFiles.push(file);
  }

  if (rejectedFiles.length > 0) {
    errors.push({
      code: "REJECTED_FILES",
      message: `${rejectedFiles.length} file${rejectedFiles.length === 1 ? " was" : "s were"} rejected by validation.`,
    });
  }

  if (tool.bestEffort) {
    warnings.push({
      code: "BEST_EFFORT",
      message: "Output quality is best effort and may require manual cleanup.",
    });
  }

  if (tool.id === "sign-pdf") {
    warnings.push({
      code: "MANUAL_SIGNATURE_FLOW",
      message: "Requesting signatures from others requires manual export and external sharing.",
    });
  }

  if (tool.id === "html-to-pdf") {
    warnings.push({
      code: "LOCAL_HTML_ONLY",
      message: "Offline mode supports local HTML files, not live remote URLs.",
    });
  }

  if (files.some((file) => getExtension(file.name) === "pdf")) {
    warnings.push({
      code: "PASSWORD_PROTECTED_CHECK",
      message: "Password-protected PDFs are verified during backend execution.",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    acceptedFiles,
    rejectedFiles,
  };
}
