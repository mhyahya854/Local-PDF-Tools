import type { OutputFormat } from "@/types/tools";

export interface BuildOutputFilenameInput {
  toolId: string;
  outputExtension: OutputFormat;
  inputFileNames: string[];
  timestamp?: Date;
}

export function buildOutputFilename(input: BuildOutputFilenameInput): string {
  const date = input.timestamp ?? new Date();
  const extension = input.outputExtension;

  if (input.inputFileNames.length === 1) {
    const [single] = input.inputFileNames;
    const stem = sanitizeSegment(stripExtension(single));
    return `${stem}-${sanitizeSegment(input.toolId)}.${extension}`;
  }

  const stamp = [
    date.getUTCFullYear(),
    `${date.getUTCMonth() + 1}`.padStart(2, "0"),
    `${date.getUTCDate()}`.padStart(2, "0"),
    `${date.getUTCHours()}`.padStart(2, "0"),
    `${date.getUTCMinutes()}`.padStart(2, "0"),
    `${date.getUTCSeconds()}`.padStart(2, "0"),
  ].join("");

  return `${sanitizeSegment(input.toolId)}-${stamp}.${extension}`;
}

export function buildOutputDirectory(toolId: string, timestamp = new Date()): string {
  const date = `${timestamp.getFullYear()}-${`${timestamp.getMonth() + 1}`.padStart(2, "0")}-${`${timestamp.getDate()}`.padStart(2, "0")}`;
  return `outputs/${sanitizeSegment(toolId)}/${date}`;
}

function stripExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf(".");
  if (lastDot <= 0) {
    return fileName;
  }
  return fileName.slice(0, lastDot);
}

function sanitizeSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
