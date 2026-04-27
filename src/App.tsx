import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppErrorBoundary } from "@/components/system/AppErrorBoundary";
import { SettingsProvider } from "@/providers/SettingsProvider";
import { EngineProvider } from "@/providers/EngineProvider";

const SelectFormat = lazy(() => import("./pages/SelectFormat.tsx"));
const Tools = lazy(() => import("./pages/Tools.tsx"));
const ToolPage = lazy(() => import("./pages/ToolPage.tsx"));
const Jobs = lazy(() => import("./pages/Jobs.tsx"));
const Settings = lazy(() => import("./pages/Settings.tsx"));
const About = lazy(() => import("./pages/About.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const queryClient = new QueryClient();

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-sm text-muted-foreground">
      Loading page...
    </div>
  );
}

const App = () => (
  <AppErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <EngineProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                  <Route path="/" element={<SelectFormat />} />
                  <Route path="/tools" element={<Tools />} />
                  <Route path="/tool/:toolId" element={<ToolPage />} />
                  <Route path="/jobs" element={<Jobs />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/about" element={<About />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </EngineProvider>
      </SettingsProvider>
    </QueryClientProvider>
  </AppErrorBoundary>
);

export default App;
