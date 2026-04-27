import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  cleanupTmp,
  getRuntimeDiagnostics,
  isDesktopRuntime,
  listPersistedJobs,
  listSupportedEngines,
  listToolCapabilities,
} from "@/lib/backend";
import type { EngineAvailability, RuntimeDiagnostics, ToolCapability } from "@/types/tools";
import { useJobStore } from "@/stores/useJobStore";

interface EngineContextValue {
  isDesktop: boolean;
  loading: boolean;
  engines: EngineAvailability[];
  capabilities: ToolCapability[];
  diagnostics: RuntimeDiagnostics;
  refresh: () => Promise<void>;
}

const EngineContext = createContext<EngineContextValue | null>(null);

interface EngineProviderProps {
  children: React.ReactNode;
}

export function EngineProvider({ children }: EngineProviderProps) {
  const desktop = isDesktopRuntime();
  const [engines, setEngines] = useState<EngineAvailability[]>([]);
  const [capabilities, setCapabilities] = useState<ToolCapability[]>([]);
  const [diagnostics, setDiagnostics] = useState<RuntimeDiagnostics>({
    runtime: desktop ? "desktop" : "web",
    invokeAvailable: desktop,
    dialogPluginExpected: desktop,
    engineProbeFetched: false,
  });
  const [loading, setLoading] = useState(true);
  const hydrateJobs = useJobStore((state) => state.hydrateJobs);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [availableEngines, toolCapabilities, runtimeDiagnostics] = await Promise.all([
        listSupportedEngines(),
        listToolCapabilities(),
        getRuntimeDiagnostics(),
      ]);
      setEngines(availableEngines);
      setCapabilities(toolCapabilities);
      setDiagnostics(runtimeDiagnostics);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    void refresh();

    (async () => {
      try {
        await cleanupTmp();
        const persisted = await listPersistedJobs();
        if (!cancelled && persisted.length > 0) {
          hydrateJobs(persisted);
        }
      } catch {
        // Ignore persisted-job load failures and continue startup.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrateJobs, refresh]);

  const value = useMemo(
    () => ({
      isDesktop: desktop,
      loading,
      engines,
      capabilities,
      diagnostics,
      refresh,
    }),
    [desktop, engines, capabilities, diagnostics, loading, refresh],
  );

  return <EngineContext.Provider value={value}>{children}</EngineContext.Provider>;
}

export function useToolCapability(toolId?: string) {
  const { capabilities } = useEngines();
  return capabilities.find((capability) => capability.toolId === toolId);
}

export function useEngines() {
  const context = useContext(EngineContext);
  if (!context) {
    throw new Error("useEngines must be used inside EngineProvider.");
  }
  return context;
}
