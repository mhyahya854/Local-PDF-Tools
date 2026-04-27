import type { ToolDefinition, ToolOptions } from "@/types/tools";
import MergePdfOptions, {
  type MergePdfOptionsValue,
} from "@/components/tools/forms/MergePdfOptions";
import SplitPdfOptions, {
  type SplitPdfOptionsValue,
} from "@/components/tools/forms/SplitPdfOptions";
import RotatePdfOptions, {
  type RotatePdfOptionsValue,
} from "@/components/tools/forms/RotatePdfOptions";
import CompressPdfOptions, {
  type CompressPdfOptionsValue,
} from "@/components/tools/forms/CompressPdfOptions";
import WatermarkOptions, {
  type WatermarkOptionsValue,
} from "@/components/tools/forms/WatermarkOptions";
import ProtectPdfOptions, {
  type ProtectPdfOptionsValue,
} from "@/components/tools/forms/ProtectPdfOptions";
import UnlockPdfOptions, {
  type UnlockPdfOptionsValue,
} from "@/components/tools/forms/UnlockPdfOptions";

interface ToolOptionsRendererProps {
  tool: ToolDefinition;
  value: ToolOptions;
  onChange: (next: ToolOptions) => void;
}

export default function ToolOptionsRenderer({ tool, value, onChange }: ToolOptionsRendererProps) {
  if (tool.optionSchemaKey === "none") {
    return <p className="text-sm text-muted-foreground">No additional options for this tool.</p>;
  }

  const coerce = <T extends ToolOptions,>(raw: ToolOptions): T => raw as unknown as T;

  switch (tool.optionSchemaKey) {
    case "mergePdfOptions":
      return (
        <MergePdfOptions
          value={coerce<MergePdfOptionsValue>(value)}
          onChange={(next) => onChange(next)}
        />
      );
    case "splitPdfOptions":
      return (
        <SplitPdfOptions
          value={coerce<SplitPdfOptionsValue>(value)}
          onChange={(next) => onChange(next)}
        />
      );
    case "rotatePdfOptions":
      return (
        <RotatePdfOptions
          value={coerce<RotatePdfOptionsValue>(value)}
          onChange={(next) => onChange(next)}
        />
      );
    case "compressPdfOptions":
      return (
        <CompressPdfOptions
          value={coerce<CompressPdfOptionsValue>(value)}
          onChange={(next) => onChange(next)}
        />
      );
    case "watermarkOptions":
      return (
        <WatermarkOptions
          value={coerce<WatermarkOptionsValue>(value)}
          onChange={(next) => onChange(next)}
        />
      );
    case "protectPdfOptions":
      return (
        <ProtectPdfOptions
          value={coerce<ProtectPdfOptionsValue>(value)}
          onChange={(next) => onChange(next)}
        />
      );
    case "unlockPdfOptions":
      return (
        <UnlockPdfOptions
          value={coerce<UnlockPdfOptionsValue>(value)}
          onChange={(next) => onChange(next)}
        />
      );
    default:
      return (
        <p className="text-sm text-muted-foreground">
          Option panel for {tool.optionSchemaKey} is not wired yet.
        </p>
      );
  }
}
