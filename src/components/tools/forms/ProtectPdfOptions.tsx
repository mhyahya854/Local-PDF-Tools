import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { ToolOptions } from "@/types/tools";

export interface ProtectPdfOptionsValue extends ToolOptions {
  userPassword: string;
  ownerPassword: string;
  allowPrint: boolean;
  allowCopy: boolean;
}

interface ProtectPdfOptionsProps {
  value: ProtectPdfOptionsValue;
  onChange: (next: ProtectPdfOptionsValue) => void;
}

export default function ProtectPdfOptions({ value, onChange }: ProtectPdfOptionsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="user-password">Open password</Label>
        <Input
          id="user-password"
          type="password"
          value={value.userPassword}
          onChange={(event) => onChange({ ...value, userPassword: event.target.value })}
          placeholder="Required to open the file"
          autoComplete="new-password"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="owner-password">Permissions password</Label>
        <Input
          id="owner-password"
          type="password"
          value={value.ownerPassword}
          onChange={(event) => onChange({ ...value, ownerPassword: event.target.value })}
          placeholder="Required and must differ from open password"
          autoComplete="new-password"
        />
      </div>

      <div className="space-y-2 rounded-lg border bg-background p-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm">Allow printing</Label>
          <Switch
            checked={value.allowPrint}
            onCheckedChange={(checked) => onChange({ ...value, allowPrint: checked })}
          />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <Label className="text-sm">Allow copying</Label>
          <Switch
            checked={value.allowCopy}
            onCheckedChange={(checked) => onChange({ ...value, allowCopy: checked })}
          />
        </div>
      </div>
    </div>
  );
}
