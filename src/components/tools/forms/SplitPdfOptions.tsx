import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ToolOptions } from "@/types/tools";

export interface SplitPdfOptionsValue extends ToolOptions {
  mode: "range" | "every";
  ranges: string;
  everyNPages: number;
}

interface SplitPdfOptionsProps {
  value: SplitPdfOptionsValue;
  onChange: (next: SplitPdfOptionsValue) => void;
}

export default function SplitPdfOptions({ value, onChange }: SplitPdfOptionsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="split-mode">Split mode</Label>
        <select
          id="split-mode"
          value={value.mode}
          onChange={(event) =>
            onChange({
              ...value,
              mode: event.target.value as SplitPdfOptionsValue["mode"],
            })
          }
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="range">Page ranges</option>
          <option value="every">Every N pages</option>
        </select>
      </div>

      {value.mode === "range" ? (
        <div className="space-y-2">
          <Label htmlFor="split-ranges">Page ranges</Label>
          <Input
            id="split-ranges"
            value={value.ranges}
            onChange={(event) => onChange({ ...value, ranges: event.target.value })}
            placeholder="1,3,5-8"
          />
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="every-n-pages">Every N pages</Label>
          <Input
            id="every-n-pages"
            type="number"
            min={1}
            value={value.everyNPages}
            onChange={(event) =>
              onChange({
                ...value,
                everyNPages: Math.max(1, Number(event.target.value) || 1),
              })
            }
          />
        </div>
      )}
    </div>
  );
}
