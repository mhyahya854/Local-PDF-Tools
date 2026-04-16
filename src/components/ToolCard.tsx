import { Link } from "react-router-dom";
import { icons } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  categoryBgClasses,
  categoryTextClasses,
} from "@/data/pdfTools";
import { getToolStatusLabel, isToolRunnable } from "@/lib/toolRegistry";
import type { ToolDefinition } from "@/types/tools";

interface ToolCardProps {
  tool: ToolDefinition;
}

const ToolCard = ({ tool }: ToolCardProps) => {
  const IconComponent = icons[tool.icon as keyof typeof icons];
  const bgClass = categoryBgClasses[tool.category];
  const textClass = categoryTextClasses[tool.category];
  const runnable = isToolRunnable(tool);
  const statusLabel = getToolStatusLabel(tool.status);

  return (
    <Link
      to={`/tool/${tool.id}`}
      className={`group relative flex flex-col items-start rounded-xl border bg-card p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
        runnable ? "" : "opacity-85"
      }`}
    >
      <div className="mb-3 flex w-full items-center justify-between gap-2">
        <Badge
          className={`text-[10px] px-2 py-0.5 ${
            tool.status === "ready"
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : tool.status === "beta"
                ? "bg-amber-500 text-white hover:bg-amber-600"
                : "bg-slate-500 text-white hover:bg-slate-600"
          }`}
        >
          {statusLabel}
        </Badge>
        <div className="flex items-center gap-1.5">
          <Badge variant="secondary" className="text-[10px]">
            Offline
          </Badge>
          {tool.supportsBatch && (
            <Badge variant="secondary" className="text-[10px]">
              Batch
            </Badge>
          )}
        </div>
      </div>

      <div
        className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl ${bgClass} transition-transform duration-300 group-hover:scale-110`}
      >
        {IconComponent && <IconComponent className={`h-7 w-7 ${textClass}`} />}
      </div>

      <h3 className="mb-1.5 text-sm font-semibold text-foreground">{tool.name}</h3>
      <p className="mb-3 text-xs leading-relaxed text-muted-foreground line-clamp-2">
        {tool.description}
      </p>

      <p className="text-[11px] text-muted-foreground">
        Input: {tool.inputExtensions.map((ext) => `.${ext}`).join(", ")} → Output: .{tool.outputExtension}
      </p>

      {!runnable && (
        <p className="mt-2 text-[11px] font-medium text-amber-600 dark:text-amber-400">
          Coming soon in a later implementation phase.
        </p>
      )}
    </Link>
  );
};

export default ToolCard;
