import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppErrorBoundary } from "@/components/system/AppErrorBoundary";
import { SettingsProvider } from "@/providers/SettingsProvider";
import { EngineProvider } from "@/providers/EngineProvider";
import SelectFormat from "./pages/SelectFormat.tsx";
import Tools from "./pages/Tools.tsx";
import ToolPage from "./pages/ToolPage.tsx";
import Jobs from "./pages/Jobs.tsx";
import Settings from "./pages/Settings.tsx";
import About from "./pages/About.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <AppErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <EngineProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<SelectFormat />} />
                <Route path="/tools" element={<Tools />} />
                <Route path="/tool/:toolId" element={<ToolPage />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/about" element={<About />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </EngineProvider>
      </SettingsProvider>
    </QueryClientProvider>
  </AppErrorBoundary>
);

export default App;
