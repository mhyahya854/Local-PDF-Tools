import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export interface MergePdfOptionsValue {
  reorder: boolean;
  reverse: boolean;
  includeBookmarks: boolean;
}

interface MergePdfOptionsProps {
  value: MergePdfOptionsValue;
  onChange: (next: MergePdfOptionsValue) => void;
}

export default function MergePdfOptions({ value, onChange }: MergePdfOptionsProps) {
  return (
    <div className="space-y-4">
      <OptionSwitch
        label="Allow page reordering"
        checked={value.reorder}
        onCheckedChange={(checked) => onChange({ ...value, reorder: checked })}
      />
      <OptionSwitch
        label="Reverse file order"
        checked={value.reverse}
        onCheckedChange={(checked) => onChange({ ...value, reverse: checked })}
      />
      <OptionSwitch
        label="Include source bookmarks"
        checked={value.includeBookmarks}
        onCheckedChange={(checked) => onChange({ ...value, includeBookmarks: checked })}
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
