import type { SelectedInputFile, ToolExecutionInputFile } from "@/types/tools";

export function createBrowserSelectedFiles(files: File[]): SelectedInputFile[] {
  const seed = Date.now();
  return files.map((file, index) => ({
    id: `browser:${seed}:${index}:${file.name}:${file.lastModified}:${file.size}`,
    name: file.name,
    source: "browser",
    sizeBytes: file.size,
    lastModified: file.lastModified,
    file,
  }));
}

export function createDesktopSelectedFiles(paths: string | string[]): SelectedInputFile[] {
  const normalizedPaths = Array.isArray(paths) ? paths : [paths];

  return normalizedPaths
    .filter((path): path is string => typeof path === "string" && path.trim().length > 0)
    .map((path) => ({
      id: `desktop:${path}`,
      name: extractFileName(path),
      source: "desktop" as const,
      path,
    }));
}

export function mergeSelectedFiles(
  existing: SelectedInputFile[],
  incoming: SelectedInputFile[],
  maxFiles?: number,
): SelectedInputFile[] {
  const merged: SelectedInputFile[] = [];
  const seen = new Set<string>();

  for (const file of [...existing, ...incoming]) {
    const signature = buildFileSignature(file);
    if (seen.has(signature)) {
      continue;
    }

    seen.add(signature);
    merged.push(file);

    if (typeof maxFiles === "number" && merged.length >= maxFiles) {
      break;
    }
  }

  return merged;
}

export function toExecutionInputFiles(files: SelectedInputFile[]): ToolExecutionInputFile[] {
  return files.map((file) => ({
    name: file.name,
    path: file.path,
    sizeBytes: file.sizeBytes,
  }));
}

export function extractFileName(path: string): string {
  const segments = path.split(/[\\/]/);
  return segments[segments.length - 1] || path;
}

function buildFileSignature(file: SelectedInputFile): string {
  if (file.path) {
    const normalizedPath = file.path.replace(/\\/g, "/").toLowerCase();
    return `path:${normalizedPath}`;
  }

  return `browser:${file.id}`;
}
