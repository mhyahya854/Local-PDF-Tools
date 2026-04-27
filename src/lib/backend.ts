import { toExecutionInputFiles } from "@/lib/inputFiles";
import type {
  EngineAvailability,
  RuntimeDiagnostics,
  SelectedInputFile,
  ToolCapability,
  ToolDefinition,
  ToolExecutionRequest,
  ToolExecutionResult,
  ToolOptions,
  JobRecord,
} from "@/types/tools";

type TauriInvoke = <T>(command: string, args?: Record<string, unknown>) => Promise<T>;

declare global {
  interface Window {
    __TAURI__?: {
      core?: {
        invoke?: TauriInvoke;
      };
    };
  }
}

const fallbackEngines: EngineAvailability[] = [
  { key: "qpdf", label: "qpdf", installed: false, implemented: true, runnable: false, available: false, notes: ["Not detected in browser preview mode."] },
  { key: "libreoffice", label: "LibreOffice Headless", installed: false, implemented: false, runnable: false, available: false, notes: ["Not detected in browser preview mode."] },
  { key: "render", label: "MuPDF/PDFium Render", installed: false, implemented: false, runnable: false, available: false, notes: ["Not detected in browser preview mode."] },
  { key: "ocrmypdf", label: "OCRmyPDF + Tesseract", installed: false, implemented: false, runnable: false, available: false, notes: ["Not detected in browser preview mode."] },
  { key: "html-local", label: "Local HTML Renderer", installed: true, implemented: false, runnable: false, available: false, notes: ["Browser preview mode cannot execute local engines."] },
  { key: "watermark-pipeline", label: "Overlay Pipeline", installed: true, implemented: false, runnable: false, available: false, notes: ["Browser preview mode cannot execute local engines."] },
  { key: "ghostscript", label: "Ghostscript", installed: false, implemented: false, runnable: false, available: false, notes: ["Not detected in browser preview mode."] },
];

const fallbackToolCapabilities: ToolCapability[] = [
  {
    toolId: "merge-pdf",
    engineKey: "qpdf",
    implemented: true,
    desktopOnly: true,
    browserPreview: true,
    runnable: false,
    inputExtensions: ["pdf"],
    outputExtension: "pdf",
    minFiles: 2,
    supportsBatch: true,
    supportedOptions: ["reverse"],
    sensitiveOptions: [],
    outputStrategy: "single-output",
    notes: ["Desktop runtime and qpdf are required."],
  },
  {
    toolId: "split-pdf",
    engineKey: "qpdf",
    implemented: true,
    desktopOnly: true,
    browserPreview: true,
    runnable: false,
    inputExtensions: ["pdf"],
    outputExtension: "pdf",
    minFiles: 1,
    maxFiles: 1,
    supportsBatch: false,
    supportedOptions: ["mode", "ranges", "everyNPages"],
    sensitiveOptions: [],
    outputStrategy: "range-or-page-chunks",
    notes: ["Desktop runtime and qpdf are required."],
  },
  {
    toolId: "rotate-pdf",
    engineKey: "qpdf",
    implemented: true,
    desktopOnly: true,
    browserPreview: true,
    runnable: false,
    inputExtensions: ["pdf"],
    outputExtension: "pdf",
    minFiles: 1,
    supportsBatch: true,
    supportedOptions: ["angle"],
    sensitiveOptions: [],
    outputStrategy: "one-output-per-input",
    notes: ["Desktop runtime and qpdf are required."],
  },
  {
    toolId: "unlock-pdf",
    engineKey: "qpdf",
    implemented: true,
    desktopOnly: true,
    browserPreview: false,
    runnable: false,
    inputExtensions: ["pdf"],
    outputExtension: "pdf",
    minFiles: 1,
    supportsBatch: true,
    supportedOptions: ["password"],
    sensitiveOptions: ["password"],
    outputStrategy: "one-output-per-input",
    notes: ["Desktop runtime and qpdf are required."],
  },
  {
    toolId: "protect-pdf",
    engineKey: "qpdf",
    implemented: true,
    desktopOnly: true,
    browserPreview: false,
    runnable: false,
    inputExtensions: ["pdf"],
    outputExtension: "pdf",
    minFiles: 1,
    supportsBatch: true,
    supportedOptions: ["userPassword", "ownerPassword", "allowPrint", "allowCopy"],
    sensitiveOptions: ["userPassword", "ownerPassword"],
    outputStrategy: "one-output-per-input",
    notes: ["Desktop runtime and qpdf are required."],
  },
];

function getInvoke(): TauriInvoke | undefined {
  const candidate = window.__TAURI__?.core?.invoke;
  return typeof candidate === "function" ? candidate : undefined;
}

export function isDesktopRuntime(): boolean {
  return Boolean(getInvoke());
}

export async function listSupportedEngines(): Promise<EngineAvailability[]> {
  const invoke = getInvoke();
  if (!invoke) {
    return fallbackEngines;
  }

  try {
    const engines = await invoke<EngineAvailability[]>("list_supported_engines");
    return engines;
  } catch {
    return fallbackEngines;
  }
}

export async function runToolJob(input: {
  jobId: string;
  tool: ToolDefinition;
  files: SelectedInputFile[];
  options: ToolOptions;
  outputDirectory?: string;
}): Promise<ToolExecutionResult> {
  const invoke = getInvoke();

  if (!invoke) {
    return {
      ok: false,
      outputPaths: [],
      error: "Desktop runtime required. Web preview mode cannot execute local PDF processing jobs.",
    };
  }

  const request: ToolExecutionRequest = {
    jobId: input.jobId,
    toolId: input.tool.id,
    inputFiles: toExecutionInputFiles(input.files),
    options: input.options,
    outputExtension: input.tool.outputExtension,
  };
  const trimmedOutputDirectory = input.outputDirectory?.trim();
  if (trimmedOutputDirectory) {
    request.outputDirectory = trimmedOutputDirectory;
  }

  return invoke<ToolExecutionResult>("run_tool_job", { request });
}

export async function openOutputPath(path: string): Promise<void> {
  const invoke = getInvoke();
  if (!invoke) {
    return;
  }

  await invoke<void>("open_output_path", { path });
}

export async function listPersistedJobs(): Promise<JobRecord[]> {
  const invoke = getInvoke();
  if (!invoke) return [];
  try {
    return await invoke<JobRecord[]>("list_persisted_jobs");
  } catch {
    return [];
  }
}

export async function cleanupTmp(maxAgeSeconds?: number): Promise<void> {
  const invoke = getInvoke();
  if (!invoke) return;
  await invoke<void>("cleanup_tmp", { maxAgeSeconds });
}

export async function listToolCapabilities(): Promise<ToolCapability[]> {
  const invoke = getInvoke();
  if (!invoke) {
    return fallbackToolCapabilities;
  }

  try {
    return await invoke<ToolCapability[]>("list_tool_capabilities");
  } catch {
    return fallbackToolCapabilities;
  }
}

export async function getRuntimeDiagnostics(): Promise<RuntimeDiagnostics> {
  const invoke = getInvoke();
  if (!invoke) {
    return {
      runtime: "web",
      invokeAvailable: false,
      dialogPluginExpected: false,
      engineProbeFetched: false,
    };
  }

  try {
    return await invoke<RuntimeDiagnostics>("get_runtime_diagnostics");
  } catch {
    return {
      runtime: "desktop",
      invokeAvailable: true,
      dialogPluginExpected: true,
      engineProbeFetched: false,
    };
  }
}
