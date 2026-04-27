import { ArrowDown, ArrowUp, FileText, X } from "lucide-react";
import { formatFileSize } from "@/lib/utils";
import type { SelectedInputFile } from "@/types/tools";

interface FileListProps {
  files: SelectedInputFile[];
  onRemove: (index: number) => void;
  onReorder: (from: number, to: number) => void;
}

export default function FileList({ files, onRemove, onReorder }: FileListProps) {
  if (files.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {files.map((file, index) => (
        <div
          key={file.id}
          className="flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm"
        >
          <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {typeof file.sizeBytes === "number"
                ? formatFileSize(file.sizeBytes)
                : "Size will be checked when the job runs"}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onReorder(index, index - 1)}
              disabled={index === 0}
              className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Move file up"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onReorder(index, index + 1)}
              disabled={index === files.length - 1}
              className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Move file down"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-destructive"
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
