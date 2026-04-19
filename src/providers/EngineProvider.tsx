import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { isDesktopRuntime, listSupportedEngines, listPersistedJobs } from "@/lib/backend";
import type { EngineAvailability, JobRecord } from "@/types/tools";
import { useJobStore } from "@/stores/useJobStore";

interface EngineContextValue {
  isDesktop: boolean;
  loading: boolean;
  engines: EngineAvailability[];
  refresh: () => Promise<void>;
}

const EngineContext = createContext<EngineContextValue | null>(null);

interface EngineProviderProps {
  children: React.ReactNode;
}

export function EngineProvider({ children }: EngineProviderProps) {
  const [engines, setEngines] = useState<EngineAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const desktop = isDesktopRuntime();

  async function refresh() {
    setLoading(true);
    try {
      const availableEngines = await listSupportedEngines();
      setEngines(availableEngines);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();

    // load persisted job history into the job store on startup
    (async () => {
      try {
        const persisted = await listPersistedJobs();
        if (persisted && persisted.length > 0) {
          const enqueue = useJobStore.getState().enqueueJob;
          for (const job of persisted) {
            // avoid duplicates
            const exists = useJobStore.getState().jobs.find((j) => j.id === job.id);
            if (!exists) {
              enqueue({
                id: job.id,
                toolId: job.toolId,
                toolName: job.toolName,
                status: job.status as any,
                progress: job.progress,
                inputFiles: job.inputFiles,
                outputFiles: job.outputFiles,
                options: job.options || {},
                createdAt: job.createdAt,
                updatedAt: job.updatedAt,
                error: job.error,
              });
            }
          }
        }
      } catch {
        // ignore load errors
      }
    })();
  }, []);

  const value = useMemo(
    () => ({
      isDesktop: desktop,
      loading,
      engines,
      refresh,
    }),
    [desktop, loading, engines],
  );

  return <EngineContext.Provider value={value}>{children}</EngineContext.Provider>;
}

export function useEngines() {
  const context = useContext(EngineContext);
  if (!context) {
    throw new Error("useEngines must be used inside EngineProvider.");
  }
  return context;
}
