import { AlertTriangle, CheckCircle2, LoaderCircle, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { JobRecord } from "@/types/tools";

interface JobProgressCardProps {
  job: JobRecord;
}

const statusTone: Record<JobRecord["status"], string> = {
  running: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

export default function JobProgressCard({ job }: JobProgressCardProps) {
  const statusIcon =
    job.status === "running" ? (
      <LoaderCircle className="h-4 w-4 animate-spin" />
    ) : job.status === "completed" ? (
      <CheckCircle2 className="h-4 w-4" />
    ) : job.status === "failed" ? (
      <XCircle className="h-4 w-4" />
    ) : (
      <AlertTriangle className="h-4 w-4" />
    );

  return (
    <div className="job-progress-card">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{job.toolName}</h3>
          <p className="text-xs text-muted-foreground">
            {job.inputFiles.length} input file{job.inputFiles.length === 1 ? "" : "s"}
          </p>
        </div>
        <Badge className={statusTone[job.status]}>
          <span className="mr-1.5">{statusIcon}</span>
          {job.status}
        </Badge>
      </div>

      <Progress value={job.progress} className="h-2" />

      {job.error && <p className="mt-3 text-xs text-destructive">{job.error}</p>}
      {job.warning && <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">{job.warning}</p>}

      {job.outputFiles.length > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          {job.outputFiles.length} output file{job.outputFiles.length === 1 ? "" : "s"} saved.
        </p>
      )}
    </div>
  );
}
