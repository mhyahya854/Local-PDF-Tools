import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { ToolOptions } from "@/types/tools";

export interface MergePdfOptionsValue extends ToolOptions {
  reverse: boolean;
}

interface MergePdfOptionsProps {
  value: MergePdfOptionsValue;
  onChange: (next: MergePdfOptionsValue) => void;
}

export default function MergePdfOptions({ value, onChange }: MergePdfOptionsProps) {
  return (
    <div className="space-y-4">
      <OptionSwitch
        label="Reverse file order"
        checked={value.reverse}
        onCheckedChange={(checked) => onChange({ ...value, reverse: checked })}
      />
    </div>
  );
}

interface OptionSwitchProps {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function OptionSwitch({ label, checked, onCheckedChange }: OptionSwitchProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-background p-3">
      <Label className="text-sm text-foreground">{label}</Label>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
