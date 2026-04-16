import { Link, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, icons } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { categoryBgClasses, categoryTextClasses } from "@/data/pdfTools";
import { useTool } from "@/hooks/useTool";
import { useToast } from "@/hooks/use-toast";
import { validateFilesForTool } from "@/lib/fileValidation";
import { getToolStatusLabel, isToolRunnable } from "@/lib/toolRegistry";
import { useJobRunner } from "@/hooks/useJobRunner";
import { useJobStore } from "@/stores/useJobStore";
import { openOutputPath } from "@/lib/backend";
import ToolOptionsRenderer from "@/components/tools/ToolOptionsRenderer";
import FileDropzone from "@/components/upload/FileDropzone";
import FileList from "@/components/upload/FileList";
import JobProgressCard from "@/components/jobs/JobProgressCard";
import OutputResults from "@/components/jobs/OutputResults";

const ToolPage = () => {
  const { toolId } = useParams();
  const { tool, defaultOptions } = useTool(toolId);
  const { toast } = useToast();
  const { runJob, isRunning, lastJobId } = useJobRunner();

  const jobs = useJobStore((state) => state.jobs);
  const [files, setFiles] = useState<File[]>([]);
  const [options, setOptions] = useState(defaultOptions);
  const [outputs, setOutputs] = useState<string[]>([]);

  useEffect(() => {
    setFiles([]);
    setOutputs([]);
    setOptions(defaultOptions);
  }, [tool?.id, defaultOptions]);

  const job = useMemo(() => jobs.find((item) => item.id === lastJobId), [jobs, lastJobId]);
  const validation = useMemo(() => {
    if (!tool) {
      return null;
    }
    return validateFilesForTool(files, tool);
  }, [files, tool]);

  function handleAddFiles(next: File[]) {
    setFiles((prev) => [...prev, ...next]);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function reorderFile(from: number, to: number) {
    if (to < 0 || to >= files.length || from === to) {
      return;
    }

    setFiles((prev) => {
      const clone = [...prev];
      const [item] = clone.splice(from, 1);
      clone.splice(to, 0, item);
      return clone;
    });
  }

  async function runCurrentTool() {
    if (!tool || !validation) {
      return;
    }

    if (!validation.isValid) {
      toast({
        title: "Fix file validation errors",
        description: "Check unsupported files, count limits, and required inputs before running.",
      });
      return;
    }

    const { result } = await runJob({
      tool,
      files: validation.acceptedFiles,
      options,
    });

    if (result.ok) {
      setOutputs(result.outputPaths);
      toast({
        title: "Job completed",
        description: `${result.outputPaths.length} output file${result.outputPaths.length === 1 ? "" : "s"} generated.`,
      });
    } else {
      toast({
        title: "Job failed",
        description: result.error ?? "The backend returned an unknown error.",
      });
    }
  }

  if (!tool) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center flex-col gap-4">
          <h1 className="text-2xl font-bold text-foreground">Tool not found</h1>
          <Link to="/tools" className="text-primary underline">
            Browse all tools
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const IconComponent = icons[tool.icon as keyof typeof icons];
  const bgClass = categoryBgClasses[tool.category];
  const textClass = categoryTextClasses[tool.category];
  const runnable = isToolRunnable(tool);
  const statusLabel = getToolStatusLabel(tool.status);
  const recentJobsForTool = jobs.filter((item) => item.toolId === tool.id).slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <section className="container mx-auto px-4 py-12 flex-1">
        <Link
          to="/tools"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" /> All tools
        </Link>

        <div className="mx-auto mb-10 max-w-3xl text-center">
          <div className={`mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl ${bgClass}`}>
            {IconComponent && <IconComponent className={`h-10 w-10 ${textClass}`} />}
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl mb-3">
            {tool.name}
          </h1>
          <p className="mb-4 text-lg text-muted-foreground">{tool.description}</p>

          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
            <span
              className={`rounded-full px-3 py-1 font-medium ${
                tool.status === "ready"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                  : tool.status === "beta"
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                    : "bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300"
              }`}
            >
              {statusLabel}
            </span>
            <span className="rounded-full bg-secondary px-3 py-1 font-medium text-secondary-foreground">
              Engine: {tool.engine}
            </span>
            <span className="rounded-full bg-secondary px-3 py-1 font-medium text-secondary-foreground">
              Output: .{tool.outputExtension}
            </span>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">{tool.offlineNotes}</p>

          {tool.bestEffort && (
            <div className="mx-auto mt-4 max-w-xl rounded-lg border border-amber-400/40 bg-amber-50 px-4 py-3 text-left text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
              <AlertTriangle className="mr-2 inline h-4 w-4" />
              This tool is best effort and may require manual cleanup.
            </div>
          )}

          {tool.requiresManualExport && (
            <div className="mx-auto mt-3 max-w-xl rounded-lg border border-amber-400/40 bg-amber-50 px-4 py-3 text-left text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
              <AlertTriangle className="mr-2 inline h-4 w-4" />
              Requesting signatures from other people requires manual export and sharing.
            </div>
          )}
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-xl border bg-card p-5">
            <h2 className="mb-4 text-base font-semibold text-foreground">1. File intake</h2>
            <FileDropzone
              acceptedExtensions={tool.inputExtensions}
              multiple={tool.supportsBatch}
              maxFiles={tool.maxFiles}
              onFilesAdded={handleAddFiles}
              disabled={!runnable || isRunning}
            />

            <div className="mt-4">
              <FileList files={files} onRemove={removeFile} onReorder={reorderFile} />
            </div>

            {validation && (
              <div className="mt-4 space-y-2 text-sm">
                {validation.errors.map((error) => (
                  <p key={error.code} className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive">
                    {error.message}
                  </p>
                ))}
                {validation.warnings.map((warning) => (
                  <p key={warning.code} className="rounded-md border border-amber-400/30 bg-amber-50 px-3 py-2 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                    {warning.message}
                  </p>
                ))}
                {validation.rejectedFiles.map(({ file, reason }) => (
                  <p key={`${file.name}-${reason}`} className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive">
                    {file.name}: {reason}
                  </p>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-6">
            <div className="rounded-xl border bg-card p-5">
              <h2 className="mb-4 text-base font-semibold text-foreground">2. Tool options</h2>
              <ToolOptionsRenderer tool={tool} value={options} onChange={setOptions} />
            </div>

            <div className="rounded-xl border bg-card p-5">
              <h2 className="mb-4 text-base font-semibold text-foreground">3. Run job</h2>

              {!runnable && (
                <p className="mb-3 rounded-md border border-amber-400/30 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                  This tool is planned and not executable yet.
                </p>
              )}

              <Button
                type="button"
                className="w-full bg-red-600 text-white hover:bg-red-700"
                size="lg"
                disabled={!runnable || isRunning || !validation?.isValid}
                onClick={runCurrentTool}
              >
                {isRunning ? "Running..." : `Process ${files.length} file${files.length === 1 ? "" : "s"}`}
              </Button>
            </div>

            {job && (
              <section className="rounded-xl border bg-card p-5">
                <h2 className="mb-4 text-base font-semibold text-foreground">4. Job status</h2>
                <JobProgressCard job={job} />
              </section>
            )}

            <section className="rounded-xl border bg-card p-5">
              <h2 className="mb-4 text-base font-semibold text-foreground">5. Results</h2>
              <OutputResults
                outputs={outputs}
                onOpenOutput={(path) => {
                  void openOutputPath(path);
                }}
                onRunAnother={() => {
                  setFiles([]);
                }}
              />

              {outputs.length === 0 && (
                <p className="text-sm text-muted-foreground">No output yet. Run a job to see generated files.</p>
              )}
            </section>

            {recentJobsForTool.length > 0 && (
              <section className="rounded-xl border bg-card p-5">
                <h2 className="mb-3 text-base font-semibold text-foreground">Recent history</h2>
                <ul className="space-y-2 text-sm">
                  {recentJobsForTool.map((recent) => (
                    <li key={recent.id} className="rounded-md border bg-background px-3 py-2 text-muted-foreground">
                      {new Date(recent.createdAt).toLocaleString()} - {recent.status}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </section>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ToolPage;
