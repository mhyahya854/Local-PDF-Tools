import { createContext, useContext, useEffect, useMemo, useState } from "react";

type ThemePreference = "light" | "dark" | "system";

interface SettingsContextValue {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
  outputDirectory: string;
  setOutputDirectory: (path: string) => void;
}

const THEME_KEY = "pdf-powerhouse.theme";
const OUTPUT_DIR_KEY = "pdf-powerhouse.output-directory";

const SettingsContext = createContext<SettingsContextValue | null>(null);

interface SettingsProviderProps {
  children: React.ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [theme, setTheme] = useState<ThemePreference>(() => {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
    return "system";
  });

  const [outputDirectory, setOutputDirectory] = useState<string>(() => {
    return localStorage.getItem(OUTPUT_DIR_KEY) ?? "outputs";
  });

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    const dark =
      theme === "dark" ||
      (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    document.documentElement.classList.toggle("dark", dark);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(OUTPUT_DIR_KEY, outputDirectory);
  }, [outputDirectory]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      outputDirectory,
      setOutputDirectory,
    }),
    [theme, outputDirectory],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used inside SettingsProvider.");
  }
  return context;
}
