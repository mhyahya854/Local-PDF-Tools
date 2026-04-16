import { Label } from "@/components/ui/label";

export interface CompressPdfOptionsValue {
  quality: "low" | "medium" | "high";
}

interface CompressPdfOptionsProps {
  value: CompressPdfOptionsValue;
  onChange: (next: CompressPdfOptionsValue) => void;
}

export default function CompressPdfOptions({ value, onChange }: CompressPdfOptionsProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="compress-quality">Compression level</Label>
      <select
        id="compress-quality"
        value={value.quality}
        onChange={(event) =>
          onChange({
            quality: event.target.value as CompressPdfOptionsValue["quality"],
          })
        }
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="low">Low compression (best quality)</option>
        <option value="medium">Balanced compression</option>
        <option value="high">High compression (smallest size)</option>
      </select>
    </div>
  );
}
