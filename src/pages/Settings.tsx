import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useSettings } from "@/providers/SettingsProvider";
import { useEngines } from "@/providers/EngineProvider";

const Settings = () => {
  const { theme, setTheme, outputDirectory, setOutputDirectory } = useSettings();
  const { engines, isDesktop, loading } = useEngines();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="container mx-auto flex-1 px-4 py-10">
        <h1 className="mb-1 text-3xl font-extrabold tracking-tight text-foreground">Settings</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          Manage local behavior for desktop execution and UI preferences.
        </p>

        <section className="mb-6 rounded-xl border bg-card p-5">
          <h2 className="mb-3 text-base font-semibold text-foreground">Appearance</h2>
          <label className="mb-2 block text-sm text-muted-foreground" htmlFor="theme-select">
            Theme
          </label>
          <select
            id="theme-select"
            value={theme}
            onChange={(event) => setTheme(event.target.value as "light" | "dark" | "system")}
            className="h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </section>

        <section className="mb-6 rounded-xl border bg-card p-5">
          <h2 className="mb-3 text-base font-semibold text-foreground">Output Path</h2>
          <label className="mb-2 block text-sm text-muted-foreground" htmlFor="output-directory">
            Default output directory
          </label>
          <input
            id="output-directory"
            value={outputDirectory}
            onChange={(event) => setOutputDirectory(event.target.value)}
            className="h-10 w-full max-w-xl rounded-md border border-input bg-background px-3 text-sm"
            placeholder="outputs"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            In desktop mode, backend commands can resolve this to an absolute local path.
          </p>
        </section>

        <section className="rounded-xl border bg-card p-5">
          <h2 className="mb-3 text-base font-semibold text-foreground">Engine Availability</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Runtime: {isDesktop ? "Desktop (Tauri)" : "Browser preview"}
          </p>

          {loading ? (
            <p className="text-sm text-muted-foreground">Checking engines...</p>
          ) : (
            <ul className="space-y-2">
              {engines.map((engine) => (
                <li
                  key={engine.key}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-background px-3 py-2"
                >
                  <span className="text-sm font-medium text-foreground">{engine.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      engine.available
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300"
                    }`}
                  >
                    {engine.available ? "Available" : "Unavailable"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Settings;
