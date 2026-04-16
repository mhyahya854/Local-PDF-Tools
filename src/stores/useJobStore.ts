import { create } from "zustand";
import type { JobRecord, JobStatus } from "@/types/tools";

interface JobStore {
  jobs: JobRecord[];
  activeJobId: string | null;
  enqueueJob: (job: JobRecord) => void;
  setActiveJob: (jobId: string | null) => void;
  setJobProgress: (jobId: string, progress: number) => void;
  updateJobStatus: (jobId: string, status: JobStatus, error?: string) => void;
  setJobOutputs: (jobId: string, outputFiles: string[]) => void;
  clearCompleted: () => void;
  clearAll: () => void;
}

export const useJobStore = create<JobStore>((set) => ({
  jobs: [],
  activeJobId: null,
  enqueueJob: (job) =>
    set((state) => ({
      jobs: [job, ...state.jobs],
      activeJobId: job.id,
    })),
  setActiveJob: (jobId) =>
    set(() => ({
      activeJobId: jobId,
    })),
  setJobProgress: (jobId, progress) =>
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.id === jobId
          ? {
              ...job,
              progress,
              updatedAt: new Date().toISOString(),
            }
          : job,
      ),
    })),
  updateJobStatus: (jobId, status, error) =>
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.id === jobId
          ? {
              ...job,
              status,
              error,
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
    set((state) => ({
      jobs: state.jobs.filter((job) => job.status !== "completed"),
    })),
  clearAll: () =>
    set(() => ({
      jobs: [],
      activeJobId: null,
    })),
}));
