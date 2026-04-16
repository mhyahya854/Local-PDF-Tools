import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface WatermarkOptionsValue {
  mode: "text" | "image";
  text: string;
  opacity: number;
  rotation: number;
  position: string;
}

interface WatermarkOptionsProps {
  value: WatermarkOptionsValue;
  onChange: (next: WatermarkOptionsValue) => void;
}

export default function WatermarkOptions({ value, onChange }: WatermarkOptionsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="watermark-mode">Watermark mode</Label>
        <select
          id="watermark-mode"
          value={value.mode}
          onChange={(event) =>
            onChange({
              ...value,
              mode: event.target.value as WatermarkOptionsValue["mode"],
            })
          }
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="text">Text</option>
          <option value="image">Image</option>
        </select>
      </div>

      {value.mode === "text" && (
        <div className="space-y-2">
          <Label htmlFor="watermark-text">Text</Label>
          <Input
            id="watermark-text"
            value={value.text}
            onChange={(event) => onChange({ ...value, text: event.target.value })}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="watermark-opacity">Opacity</Label>
          <Input
            id="watermark-opacity"
            type="number"
            min={0}
            max={1}
            step={0.05}
            value={value.opacity}
            onChange={(event) => onChange({ ...value, opacity: Number(event.target.value) || 0 })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="watermark-rotation">Rotation</Label>
          <Input
            id="watermark-rotation"
            type="number"
            value={value.rotation}
            onChange={(event) => onChange({ ...value, rotation: Number(event.target.value) || 0 })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="watermark-position">Position</Label>
          <Input
            id="watermark-position"
            value={value.position}
            onChange={(event) => onChange({ ...value, position: event.target.value })}
            placeholder="center"
          />
        </div>
      </div>
    </div>
  );
}
