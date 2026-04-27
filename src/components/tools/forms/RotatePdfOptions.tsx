import { Label } from "@/components/ui/label";
import type { ToolOptions } from "@/types/tools";

export interface RotatePdfOptionsValue extends ToolOptions {
  angle: 90 | 180 | 270;
}

interface RotatePdfOptionsProps {
  value: RotatePdfOptionsValue;
  onChange: (next: RotatePdfOptionsValue) => void;
}

export default function RotatePdfOptions({ value, onChange }: RotatePdfOptionsProps) {
  const angle = value.angle === 180 || value.angle === 270 ? value.angle : 90;

  return (
    <div className="space-y-2">
      <Label htmlFor="rotate-angle">Rotation</Label>
      <select
        id="rotate-angle"
        value={angle}
        onChange={(event) =>
          onChange({
            angle: Number(event.target.value) as RotatePdfOptionsValue["angle"],
          })
        }
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value={90}>90 degrees clockwise</option>
        <option value={180}>180 degrees</option>
        <option value={270}>270 degrees clockwise</option>
      </select>
    </div>
  );
}
