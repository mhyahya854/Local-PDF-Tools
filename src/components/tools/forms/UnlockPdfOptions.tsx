import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ToolOptions } from "@/types/tools";

export interface UnlockPdfOptionsValue extends ToolOptions {
  password: string;
}

interface UnlockPdfOptionsProps {
  value: UnlockPdfOptionsValue;
  onChange: (next: UnlockPdfOptionsValue) => void;
}

export default function UnlockPdfOptions({ value, onChange }: UnlockPdfOptionsProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="unlock-password">Current password</Label>
      <Input
        id="unlock-password"
        type="password"
        value={value.password}
        onChange={(event) => onChange({ password: event.target.value })}
        placeholder="Leave empty if the file has no password"
        autoComplete="current-password"
      />
    </div>
  );
}
