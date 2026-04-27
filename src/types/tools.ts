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
  | "rotatePdfOptions"
  | "compressPdfOptions"
  | "watermarkOptions"
  | "protectPdfOptions"
  | "unlockPdfOptions";

export type ToolOptions = Record<string, unknown>;

export interface SelectedInputFile {
  id: string;
  name: string;
  source: "browser" | "desktop";
  sizeBytes?: number;
  lastModified?: number;
  path?: string;
  file?: File;
}

export interface ToolExecutionInputFile {
  name: string;
  path?: string;
  sizeBytes?: number;
}

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
  installed: boolean;
  implemented: boolean;
  runnable: boolean;
  available: boolean;
  notes?: string[];
  supportsBatch?: boolean;
  supportsPasswordProtectedFiles?: boolean;
  supportsOcr?: boolean;
  requiresExternalBinary?: boolean;
}

export interface RuntimeDiagnostics {
  runtime: "desktop" | "web";
  invokeAvailable: boolean;
  dialogPluginExpected: boolean;
  engineProbeFetched: boolean;
}

export interface ToolCapability {
  toolId: string;
  engineKey: PdfEngine;
  implemented: boolean;
  desktopOnly: boolean;
  browserPreview: boolean;
  runnable: boolean;
  inputExtensions: string[];
  outputExtension: OutputFormat;
  minFiles: number;
  maxFiles?: number;
  supportsBatch: boolean;
  supportedOptions: string[];
  sensitiveOptions: string[];
  outputStrategy: string;
  notes: string[];
}

export interface ToolExecutionRequest {
  jobId: string;
  toolId: string;
  inputFiles: ToolExecutionInputFile[];
  options: ToolOptions;
  outputExtension: OutputFormat;
  outputDirectory?: string;
}

export interface ToolExecutionResult {
  ok: boolean;
  outputPaths: string[];
  error?: string;
  warning?: string;
}

export type JobStatus = "running" | "completed" | "failed";

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
  warning?: string;
}
