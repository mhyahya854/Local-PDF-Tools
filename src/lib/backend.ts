import { buildOutputDirectory, buildOutputFilename } from "@/lib/outputNames";
import type {
  EngineAvailability,
  ToolDefinition,
  ToolExecutionRequest,
  ToolExecutionResult,
  ToolOptions,
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
  { key: "qpdf", label: "qpdf", available: false, notes: "Not detected in browser preview mode." },
  { key: "libreoffice", label: "LibreOffice Headless", available: false, notes: "Not detected in browser preview mode." },
  { key: "render", label: "MuPDF/PDFium Render", available: false, notes: "Not detected in browser preview mode." },
  { key: "ocrmypdf", label: "OCRmyPDF + Tesseract", available: false, notes: "Not detected in browser preview mode." },
  { key: "html-local", label: "Local HTML Renderer", available: false, notes: "Not detected in browser preview mode." },
  { key: "watermark-pipeline", label: "Overlay Pipeline", available: false, notes: "Not detected in browser preview mode." },
  { key: "ghostscript", label: "Ghostscript", available: false, notes: "Not detected in browser preview mode." },
];

function getInvoke(): TauriInvoke | undefined {
  return window.__TAURI__?.core?.invoke;
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
  files: File[];
  options: ToolOptions;
  onProgress?: (value: number) => void;
}): Promise<ToolExecutionResult> {
  const invoke = getInvoke();

  if (!invoke) {
    return runBrowserFallback(input);
  }

  const request: ToolExecutionRequest = {
    jobId: input.jobId,
    toolId: input.tool.id,
    fileNames: input.files.map((file) => file.name),
    options: input.options,
    outputExtension: input.tool.outputExtension,
  };

  return invoke<ToolExecutionResult>("run_tool_job", { request });
}

export async function openOutputPath(path: string): Promise<void> {
  const invoke = getInvoke();
  if (!invoke) {
    return;
  }

  await invoke<void>("open_output_path", { path });
}

async function runBrowserFallback(input: {
  jobId: string;
  tool: ToolDefinition;
  files: File[];
  options: ToolOptions;
  onProgress?: (value: number) => void;
}): Promise<ToolExecutionResult> {
  for (const step of [15, 35, 60, 80, 100]) {
    input.onProgress?.(step);
    await wait(120);
  }

  const outputDirectory = buildOutputDirectory(input.tool.id);

  const outputPaths = (input.tool.supportsBatch ? input.files : input.files.slice(0, 1)).map((file) => {
    const filename = buildOutputFilename({
      toolId: input.tool.id,
      outputExtension: input.tool.outputExtension,
      inputFileNames: [file.name],
    });

    return `${outputDirectory}/${filename}`;
  });

  return {
    ok: true,
    outputPaths,
    warning: "Running in browser fallback mode. No local engine execution occurred.",
  };
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
