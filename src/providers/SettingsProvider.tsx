import { createContext, useContext, useEffect, useMemo, useState } from "react";

type ThemePreference = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface SettingsContextValue {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
  outputDirectory: string;
  setOutputDirectory: (path: string) => void;
}

const THEME_KEY = "pdf-powerhouse.theme";
const OUTPUT_DIR_KEY = "pdf-powerhouse.output-directory";
const SYSTEM_THEME_QUERY = "(prefers-color-scheme: dark)";

function readStoredValue(key: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStoredValue(key: string, value: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures and continue with in-memory state.
  }
}

function readSystemPrefersDark(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia(SYSTEM_THEME_QUERY).matches;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

interface SettingsProviderProps {
  children: React.ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [theme, setTheme] = useState<ThemePreference>(() => {
    const stored = readStoredValue(THEME_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
    return "system";
  });

  const [outputDirectory, setOutputDirectory] = useState<string>(() => {
    return normalizeOutputDirectory(readStoredValue(OUTPUT_DIR_KEY) ?? "outputs");
  });
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => readSystemPrefersDark());

  const resolvedTheme: ResolvedTheme =
    theme === "dark" || (theme === "system" && systemPrefersDark) ? "dark" : "light";

  useEffect(() => {
    if (theme !== "system" || typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia(SYSTEM_THEME_QUERY);
    const syncPreference = () => setSystemPrefersDark(mediaQuery.matches);

    syncPreference();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncPreference);
      return () => mediaQuery.removeEventListener("change", syncPreference);
    }

    mediaQuery.addListener(syncPreference);
    return () => mediaQuery.removeListener(syncPreference);
  }, [theme]);

  useEffect(() => {
    writeStoredValue(THEME_KEY, theme);

    if (typeof document === "undefined") {
      return;
    }

    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
  }, [resolvedTheme, theme]);

  useEffect(() => {
    writeStoredValue(OUTPUT_DIR_KEY, outputDirectory);
  }, [outputDirectory]);

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      outputDirectory,
      setOutputDirectory: (path: string) => setOutputDirectory(normalizeOutputDirectory(path)),
    }),
    [outputDirectory, resolvedTheme, theme],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

function normalizeOutputDirectory(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "outputs";
  }

  const segments = trimmed
    .split(/[\\/]/)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0 && segment !== "." && segment !== "..")
    .map((segment) => segment.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""))
    .filter((segment) => segment.length > 0);

  if (segments.length === 0) {
    return "outputs";
  }

  return segments.join("/");
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used inside SettingsProvider.");
  }
  return context;
}
