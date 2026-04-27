import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useJobStore } from "@/stores/useJobStore";
import type { JobRecord } from "@/types/tools";

function resetJobStore() {
  useJobStore.setState({
    jobs: [],
    activeJobId: null,
  });
}

function createJobRecord(overrides: Partial<JobRecord> & Pick<JobRecord, "id">): JobRecord {
  const { id, ...rest } = overrides;
  return {
    id,
    toolId: "merge-pdf",
    toolName: "Merge Pdf",
    status: "completed",
    progress: 100,
    inputFiles: ["one.pdf"],
    outputFiles: ["merged.pdf"],
    options: {},
    createdAt: "2026-04-23T00:00:00Z",
    updatedAt: "2026-04-23T00:00:00Z",
    error: undefined,
    ...rest,
  };
}

beforeEach(() => {
  resetJobStore();
});

afterEach(() => {
  resetJobStore();
});

describe("job store hydration", () => {
  it("merges persisted mock job results and sorts newest first", () => {
    const store = useJobStore.getState();

    store.enqueueJob(
      createJobRecord({
        id: "job-1",
        status: "running",
        progress: 45,
        updatedAt: "2026-04-23T00:05:00Z",
      }),
    );

    store.hydrateJobs([
      createJobRecord({
        id: "job-1",
        status: "completed",
        progress: 100,
        outputFiles: ["merged.pdf"],
        updatedAt: "2026-04-23T00:10:00Z",
      }),
      createJobRecord({
        id: "job-2",
        status: "failed",
        progress: 0,
        error: "Mocked backend failure",
        updatedAt: "2026-04-23T00:20:00Z",
      }),
    ]);

    const next = useJobStore.getState();

    expect(next.jobs.map((job) => job.id)).toEqual(["job-2", "job-1"]);
    expect(next.jobs.find((job) => job.id === "job-1")?.status).toBe("completed");
    expect(next.activeJobId).toBeNull();
  });

  it("keeps the active job selected when hydration still reports it as running", () => {
    const running = createJobRecord({
      id: "job-running",
      status: "running",
      progress: 10,
      updatedAt: "2026-04-23T00:05:00Z",
    });

    useJobStore.getState().enqueueJob(running);
    useJobStore.getState().hydrateJobs([
      {
        ...running,
        progress: 70,
        updatedAt: "2026-04-23T00:15:00Z",
      },
    ]);

    const next = useJobStore.getState();

    expect(next.activeJobId).toBe("job-running");
    expect(next.jobs[0]?.progress).toBe(70);
  });
});
