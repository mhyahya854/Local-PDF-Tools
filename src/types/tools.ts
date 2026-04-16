export type ToolCategory = "merge" | "convert-to" | "convert-from" | "edit" | "security" | "optimize";

export type ToolStatus = "planned" | "beta" | "ready";

export type ToolDangerLevel = "safe" | "caution" | "destructive";

export type OutputFormat = "pdf" | "docx" | "pptx" | "xlsx" | "jpg" | "pdfa";

export type PdfEngine =
  | "qpdf"
  | "libreoffice"
  | "render"
  | "ocrmypdf"
  | "html-local"
  | "watermark-pipeline"
  | "ghostscript";

export type ToolOptionSchemaKey =
  | "none"
  | "mergePdfOptions"
  | "splitPdfOptions"
  | "compressPdfOptions"
  | "imageToPdfOptions"
  | "watermarkOptions"
  | "protectPdfOptions"
  | "pageNumberOptions"
  | "ocrPdfOptions"
  | "htmlToPdfOptions"
  | "cropPdfOptions";

export type ToolOptions = Record<string, unknown>;

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  icon: string;
  inputExtensions: string[];
  outputExtension: OutputFormat;
  engine: PdfEngine;
  supportsBatch: boolean;
  supportsPreview: boolean;
  dangerLevel: ToolDangerLevel;
  offlineNotes: string;
  optionSchemaKey: ToolOptionSchemaKey;
  status: ToolStatus;
  defaultOptions?: ToolOptions;
  minFiles?: number;
  maxFiles?: number;
  maxFileSizeMb?: number;
  bestEffort?: boolean;
  requiresManualExport?: boolean;
}

export interface OutputFormatDefinition {
  id: OutputFormat;
  label: string;
  description: string;
  icon: string;
  colorClass: string;
  hoverClass: string;
  toolCount: number;
  availableCount: number;
}

export interface EngineAvailability {
  key: PdfEngine;
  label: string;
  available: boolean;
  notes?: string;
}

export interface ToolExecutionRequest {
  jobId: string;
  toolId: string;
  fileNames: string[];
  options: ToolOptions;
  outputExtension: OutputFormat;
}

export interface ToolExecutionResult {
  ok: boolean;
  outputPaths: string[];
  error?: string;
  warning?: string;
}

export type JobStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export interface JobRecord {
  id: string;
  toolId: string;
  toolName: string;
  status: JobStatus;
  progress: number;
  inputFiles: string[];
  outputFiles: string[];
  options: ToolOptions;
  createdAt: string;
  updatedAt: string;
  error?: string;
}
