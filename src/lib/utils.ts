import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { buildOutputFilename as buildToolOutputFilename } from "@/lib/outputNames";
import { parsePageRanges as parseToolPageRanges } from "@/lib/pageRanges";
import type { OutputFormat } from "@/types/tools";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

export function getExtension(fileName: string): string {
  const trimmed = fileName.trim().toLowerCase();
  const index = trimmed.lastIndexOf(".");
  if (index <= 0 || index === trimmed.length - 1) {
    return "";
  }
  return trimmed.slice(index + 1);
}

export function isAcceptedFileType(fileName: string, acceptedExtensions: string[]): boolean {
  const ext = getExtension(fileName);
  return acceptedExtensions.includes(ext);
}

export function humanizeToolName(toolId: string): string {
  return toolId
    .split("-")
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

export function buildOutputFilename(input: {
  toolId: string;
  outputExtension: OutputFormat;
  inputFileNames: string[];
}): string {
  return buildToolOutputFilename(input);
}

export function parsePageRanges(input: string, maxPage?: number): number[] {
  return parseToolPageRanges(input, maxPage);
}

export function groupFilesByType<T extends { name: string }>(files: T[]): Record<string, T[]> {
  return files.reduce<Record<string, T[]>>((acc, file) => {
    const extension = getExtension(file.name) || "unknown";
    acc[extension] = [...(acc[extension] ?? []), file];
    return acc;
  }, {});
}
