import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { isDesktopRuntime, listSupportedEngines } from "@/lib/backend";
import type { EngineAvailability } from "@/types/tools";

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
