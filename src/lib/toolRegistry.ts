import { toolDefinitions } from "@/data/pdfTools";
import type {
  OutputFormat,
  OutputFormatDefinition,
  ToolDefinition,
  ToolOptions,
  ToolStatus,
} from "@/types/tools";

const outputFormatMeta: Record<
  OutputFormat,
  Omit<OutputFormatDefinition, "id" | "toolCount" | "availableCount">
> = {
  pdf: {
    label: "PDF",
    description: "Portable Document Format",
    icon: "FileText",
    colorClass: "bg-red-500",
    hoverClass: "hover:border-red-400 hover:shadow-red-500/20",
  },
  docx: {
    label: "Word",
    description: "DOCX Document",
    icon: "FileIcon",
    colorClass: "bg-blue-500",
    hoverClass: "hover:border-blue-400 hover:shadow-blue-500/20",
  },
  pptx: {
    label: "PowerPoint",
    description: "PPTX Presentation",
    icon: "Presentation",
    colorClass: "bg-orange-500",
    hoverClass: "hover:border-orange-400 hover:shadow-orange-500/20",
  },
  xlsx: {
    label: "Excel",
    description: "XLSX Spreadsheet",
    icon: "FileSpreadsheet",
    colorClass: "bg-emerald-500",
    hoverClass: "hover:border-emerald-400 hover:shadow-emerald-500/20",
  },
  jpg: {
    label: "Image",
    description: "JPG Image",
    icon: "Image",
    colorClass: "bg-purple-500",
    hoverClass: "hover:border-purple-400 hover:shadow-purple-500/20",
  },
  pdfa: {
    label: "PDF/A",
    description: "Archival PDF (PDF/A)",
    icon: "Archive",
    colorClass: "bg-slate-500",
    hoverClass: "hover:border-slate-400 hover:shadow-slate-500/20",
  },
};

const statusPriority: Record<ToolStatus, number> = {
  ready: 0,
  beta: 1,
  planned: 2,
};

const statusLabels: Record<ToolStatus, string> = {
  ready: "Implemented",
  beta: "Beta",
  planned: "Planned",
};

export const toolRegistry: ToolDefinition[] = [...toolDefinitions].sort((a, b) => {
  const statusDiff = statusPriority[a.status] - statusPriority[b.status];
  if (statusDiff !== 0) {
    return statusDiff;
  }
  return a.name.localeCompare(b.name);
});

export const toolRegistryMap = new Map<string, ToolDefinition>(
  toolRegistry.map((tool) => [tool.id, tool]),
);

export function getToolById(toolId?: string): ToolDefinition | undefined {
  if (!toolId) {
    return undefined;
  }
  return toolRegistryMap.get(toolId);
}

export function getOutputFormats(): OutputFormatDefinition[] {
  return (Object.keys(outputFormatMeta) as OutputFormat[]).map((formatId) => {
    const tools = toolRegistry.filter((tool) => tool.outputExtension === formatId);
    const availableCount = tools.filter((tool) => tool.status !== "planned").length;

    return {
      id: formatId,
      ...outputFormatMeta[formatId],
      toolCount: tools.length,
      availableCount,
    };
  });
}

export function getToolsByOutput(output?: string): ToolDefinition[] {
  if (!output) {
    return toolRegistry;
  }
  return toolRegistry.filter((tool) => tool.outputExtension === output);
}

export function filterTools(
  tools: ToolDefinition[],
  filters: { search?: string; category?: string; status?: ToolStatus | "all" },
): ToolDefinition[] {
  const search = filters.search?.trim().toLowerCase();

  return tools.filter((tool) => {
    if (filters.category && filters.category !== "all" && tool.category !== filters.category) {
      return false;
    }

    if (filters.status && filters.status !== "all" && tool.status !== filters.status) {
      return false;
    }

    if (!search) {
      return true;
    }

    return (
      tool.name.toLowerCase().includes(search) ||
      tool.description.toLowerCase().includes(search) ||
      tool.id.toLowerCase().includes(search)
    );
  });
}

export function getToolStatusLabel(status: ToolStatus): string {
  return statusLabels[status];
}

export function isToolRunnable(tool: ToolDefinition): boolean {
  return tool.status !== "planned";
}

export function getToolDefaultOptions(tool?: ToolDefinition): ToolOptions {
  return { ...(tool?.defaultOptions ?? {}) };
}

export function getRegistryStats() {
  const total = toolRegistry.length;
  const ready = toolRegistry.filter((tool) => tool.status === "ready").length;
  const beta = toolRegistry.filter((tool) => tool.status === "beta").length;
  const planned = toolRegistry.filter((tool) => tool.status === "planned").length;

  return { total, ready, beta, planned };
}
