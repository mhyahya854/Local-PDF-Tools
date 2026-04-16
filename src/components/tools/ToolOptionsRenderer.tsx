import type { ToolDefinition, ToolOptions } from "@/types/tools";
import MergePdfOptions, {
  type MergePdfOptionsValue,
} from "@/components/tools/forms/MergePdfOptions";
import SplitPdfOptions, {
  type SplitPdfOptionsValue,
} from "@/components/tools/forms/SplitPdfOptions";
import CompressPdfOptions, {
  type CompressPdfOptionsValue,
} from "@/components/tools/forms/CompressPdfOptions";
import WatermarkOptions, {
  type WatermarkOptionsValue,
} from "@/components/tools/forms/WatermarkOptions";
import ProtectPdfOptions, {
  type ProtectPdfOptionsValue,
} from "@/components/tools/forms/ProtectPdfOptions";

interface ToolOptionsRendererProps {
  tool: ToolDefinition;
  value: ToolOptions;
  onChange: (next: ToolOptions) => void;
}

export default function ToolOptionsRenderer({ tool, value, onChange }: ToolOptionsRendererProps) {
  if (tool.optionSchemaKey === "none") {
    return <p className="text-sm text-muted-foreground">No additional options for this tool.</p>;
  }

  switch (tool.optionSchemaKey) {
    case "mergePdfOptions":
      return (
        <MergePdfOptions
          value={value as MergePdfOptionsValue}
          onChange={(next) => onChange(next)}
        />
      );
    case "splitPdfOptions":
      return (
        <SplitPdfOptions
          value={value as SplitPdfOptionsValue}
          onChange={(next) => onChange(next)}
        />
      );
    case "compressPdfOptions":
      return (
        <CompressPdfOptions
          value={value as CompressPdfOptionsValue}
          onChange={(next) => onChange(next)}
        />
      );
    case "watermarkOptions":
      return (
        <WatermarkOptions
          value={value as WatermarkOptionsValue}
          onChange={(next) => onChange(next)}
        />
      );
    case "protectPdfOptions":
      return (
        <ProtectPdfOptions
          value={value as ProtectPdfOptionsValue}
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
