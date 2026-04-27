import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getRuntimeDiagnostics,
  listPersistedJobs,
  listSupportedEngines,
  listToolCapabilities,
  runToolJob,
} from "@/lib/backend";
import { createBrowserSelectedFiles, createDesktopSelectedFiles } from "@/lib/inputFiles";
import { getToolById } from "@/lib/toolRegistry";
import type { EngineAvailability, JobRecord } from "@/types/tools";

let tempDir: string | undefined;

async function createMockPdfPath(fileName: string) {
  tempDir = await mkdtemp(join(tmpdir(), "local-pdf-tools-"));
  const filePath = join(tempDir, fileName);
  await writeFile(filePath, "%PDF-1.4\n% mock pdf\n1 0 obj\n<<>>\nendobj\n");
  return filePath;
}

function asTauriInvoke(
  fn: (command: string, args?: Record<string, unknown>) => Promise<unknown>,
): <T>(command: string, args?: Record<string, unknown>) => Promise<T> {
  return fn as <T>(command: string, args?: Record<string, unknown>) => Promise<T>;
}

afterEach(async () => {
  delete window.__TAURI__;
  vi.useRealTimers();
  vi.restoreAllMocks();

  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
    tempDir = undefined;
  }
});

describe("backend runtime contract", () => {
  it("rejects browser preview execution with explicit non-executable response", async () => {
    const tool = getToolById("merge-pdf");
    expect(tool).toBeDefined();

    const files = createBrowserSelectedFiles([
      new File(["first"], "Quarterly Report.pdf", { type: "application/pdf", lastModified: 1 }),
      new File(["second"], "Invoices.pdf", { type: "application/pdf", lastModified: 2 }),
    ]);

    await expect(
      runToolJob({
        jobId: "job-browser-mock",
        tool: tool!,
        files,
        options: { reverse: false },
      }),
    ).resolves.toEqual({
      ok: false,
      outputPaths: [],
      error: "Desktop runtime required. Web preview mode cannot execute local PDF processing jobs.",
    });
  });

  it("sends desktop jobs to Tauri with explicit mock file paths", async () => {
    const tool = getToolById("merge-pdf");
    expect(tool).toBeDefined();

    const mockPdfPath = await createMockPdfPath("Quarterly Report.pdf");
    const [file] = createDesktopSelectedFiles(mockPdfPath);
    const invoke = vi.fn().mockResolvedValue({
      ok: true,
      outputPaths: [join(tempDir!, "merged.pdf")],
    });

    window.__TAURI__ = {
      core: {
        invoke: asTauriInvoke(invoke),
      },
    };

    const result = await runToolJob({
      jobId: "job-desktop-mock",
      tool: tool!,
      files: [file],
      options: { reverse: true },
      outputDirectory: "exports/reports",
    });

    expect(result.ok).toBe(true);
    expect(invoke).toHaveBeenCalledWith("run_tool_job", {
      request: {
        jobId: "job-desktop-mock",
        toolId: "merge-pdf",
        inputFiles: [
          {
            name: "Quarterly Report.pdf",
            path: mockPdfPath,
            sizeBytes: undefined,
          },
        ],
        options: { reverse: true },
        outputExtension: "pdf",
        outputDirectory: "exports/reports",
      },
    });
  });

  it("hydrates mocked desktop engine and job responses from Tauri", async () => {
    const engines: EngineAvailability[] = [
      {
        key: "qpdf",
        label: "qpdf",
        installed: true,
        implemented: true,
        runnable: true,
        available: true,
        notes: ["Mocked engine"],
      },
    ];
    const jobs: JobRecord[] = [
      {
        id: "job-1",
        toolId: "merge-pdf",
        toolName: "Merge Pdf",
        status: "completed",
        progress: 100,
        inputFiles: ["one.pdf"],
        outputFiles: ["merged.pdf"],
        options: { reverse: false },
        createdAt: "2026-04-23T00:00:00Z",
        updatedAt: "2026-04-23T00:10:00Z",
      },
    ];
    const invoke = vi.fn(async (command: string) => {
      if (command === "list_supported_engines") {
        return engines;
      }
      if (command === "list_persisted_jobs") {
        return jobs;
      }
      throw new Error(`Unexpected command: ${command}`);
    });

    window.__TAURI__ = {
      core: {
        invoke: asTauriInvoke(invoke),
      },
    };

    await expect(listSupportedEngines()).resolves.toEqual(engines);
    await expect(listPersistedJobs()).resolves.toEqual(jobs);
  });

  it("reports fallback web diagnostics and qpdf desktop-only capabilities", async () => {
    await expect(getRuntimeDiagnostics()).resolves.toEqual({
      runtime: "web",
      invokeAvailable: false,
      dialogPluginExpected: false,
      engineProbeFetched: false,
    });

    const capabilities = await listToolCapabilities();
    expect(capabilities.map((capability) => capability.toolId)).toContain("merge-pdf");
    expect(capabilities.every((capability) => capability.desktopOnly)).toBe(true);
    expect(capabilities.every((capability) => capability.runnable)).toBe(false);
  });
});
