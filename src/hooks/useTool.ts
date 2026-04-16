import { useMemo } from "react";
import { getToolById, getToolDefaultOptions } from "@/lib/toolRegistry";

export function useTool(toolId?: string) {
  return useMemo(() => {
    const tool = getToolById(toolId);
    const defaultOptions = getToolDefaultOptions(tool);

    return {
      tool,
      defaultOptions,
      exists: Boolean(tool),
    };
  }, [toolId]);
}
