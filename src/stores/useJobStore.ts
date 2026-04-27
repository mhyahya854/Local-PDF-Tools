import { create } from "zustand";
import type { JobRecord, JobStatus } from "@/types/tools";

interface JobStore {
  jobs: JobRecord[];
  activeJobId: string | null;
  hydrateJobs: (jobs: JobRecord[]) => void;
  enqueueJob: (job: JobRecord) => void;
  setActiveJob: (jobId: string | null) => void;
  updateJobStatus: (jobId: string, status: JobStatus, error?: string, warning?: string) => void;
  setJobOutputs: (jobId: string, outputFiles: string[]) => void;
  clearCompleted: () => void;
  clearAll: () => void;
}

export const useJobStore = create<JobStore>((set) => ({
  jobs: [],
  activeJobId: null,
  hydrateJobs: (jobs) =>
    set((state) => {
      const merged = [...state.jobs];

      for (const job of jobs) {
        const existingIndex = merged.findIndex((candidate) => candidate.id === job.id);
        if (existingIndex >= 0) {
          merged[existingIndex] = job;
        } else {
          merged.push(job);
        }
      }

      merged.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

      return {
        jobs: merged,
        activeJobId:
          state.activeJobId && merged.some((job) => job.id === state.activeJobId && job.status === "running")
            ? state.activeJobId
            : null,
      };
    }),
  enqueueJob: (job) =>
    set((state) => ({
      jobs: [job, ...state.jobs],
      activeJobId: job.id,
    })),
  setActiveJob: (jobId) =>
    set(() => ({
      activeJobId: jobId,
    })),
  updateJobStatus: (jobId, status, error, warning) =>
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.id === jobId
          ? {
              ...job,
              status,
              error,
              warning,
              updatedAt: new Date().toISOString(),
              progress: status === "completed" ? 100 : job.progress,
            }
          : job,
      ),
      activeJobId: status === "running" ? jobId : state.activeJobId === jobId ? null : state.activeJobId,
    })),
  setJobOutputs: (jobId, outputFiles) =>
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.id === jobId
          ? {
              ...job,
              outputFiles,
              updatedAt: new Date().toISOString(),
            }
          : job,
      ),
    })),
  clearCompleted: () =>
    set((state) => {
      const jobs = state.jobs.filter((job) => job.status !== "completed");

      return {
        jobs,
        activeJobId: state.activeJobId && jobs.some((job) => job.id === state.activeJobId) ? state.activeJobId : null,
      };
    }),
  clearAll: () =>
    set(() => ({
      jobs: [],
      activeJobId: null,
    })),
}));
