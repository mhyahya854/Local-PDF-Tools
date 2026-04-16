import { FolderOpen, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OutputResultsProps {
  outputs: string[];
  onOpenOutput: (path: string) => void;
  onRunAnother: () => void;
}

export default function OutputResults({ outputs, onOpenOutput, onRunAnother }: OutputResultsProps) {
  if (outputs.length === 0) {
    return null;
  }

  return (
    <section className="output-results">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Output files</h3>
        <Button variant="outline" size="sm" onClick={onRunAnother}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Run Another
        </Button>
      </div>

      <div className="space-y-2">
        {outputs.map((path) => (
          <div key={path} className="flex items-center justify-between rounded-md border bg-background px-3 py-2">
            <p className="truncate pr-3 text-xs text-foreground">{path}</p>
            <Button variant="ghost" size="sm" onClick={() => onOpenOutput(path)}>
              <FolderOpen className="mr-2 h-4 w-4" />
              Open
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
