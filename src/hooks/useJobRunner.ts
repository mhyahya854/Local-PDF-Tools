import { useState } from "react";
import { runToolJob } from "@/lib/backend";
import { redactJobOptionsForHistory } from "@/lib/jobOptions";
import { useJobStore } from "@/stores/useJobStore";
import { useSettings } from "@/providers/SettingsProvider";
import type {
  SelectedInputFile,
  ToolCapability,
  ToolDefinition,
  ToolExecutionResult,
  ToolOptions,
} from "@/types/tools";

interface RunJobInput {
  tool: ToolDefinition;
  capability?: ToolCapability;
  files: SelectedInputFile[];
  options: ToolOptions;
}

export function useJobRunner() {
  const [isRunning, setIsRunning] = useState(false);
  const [lastJobId, setLastJobId] = useState<string | null>(null);
  const { outputDirectory } = useSettings();

  const enqueueJob = useJobStore((state) => state.enqueueJob);
  const setJobOutputs = useJobStore((state) => state.setJobOutputs);
  const updateJobStatus = useJobStore((state) => state.updateJobStatus);

  async function runJob(input: RunJobInput): Promise<{ jobId: string; result: ToolExecutionResult }> {
    const jobId = crypto.randomUUID();
    const now = new Date().toISOString();

    enqueueJob({
      id: jobId,
      toolId: input.tool.id,
      toolName: input.tool.name,
      status: "running",
      progress: 0,
      inputFiles: input.files.map((file) => file.name),
      outputFiles: [],
      options: redactJobOptionsForHistory(input.options, input.capability?.sensitiveOptions ?? []),
      createdAt: now,
      updatedAt: now,
    });

    setLastJobId(jobId);
    setIsRunning(true);

    try {
      const result = await runToolJob({
        jobId,
        tool: input.tool,
        files: input.files,
        options: input.options,
        outputDirectory,
      });

      if (result.ok) {
        setJobOutputs(jobId, result.outputPaths);
        updateJobStatus(jobId, "completed", undefined, result.warning);
      } else {
        updateJobStatus(
          jobId,
          "failed",
          result.error ?? "Unknown job failure.",
          result.warning,
        );
      }

      return { jobId, result };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error while running job.";
      updateJobStatus(jobId, "failed", message);

      return {
        jobId,
        result: {
          ok: false,
          outputPaths: [],
          error: message,
        },
      };
    } finally {
      setIsRunning(false);
    }
  }

  return {
    runJob,
    isRunning,
    lastJobId,
  };
}
