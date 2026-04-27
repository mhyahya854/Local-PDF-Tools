import { describe, expect, it } from "vitest";
import { getToolDefaultOptions, getToolsByOutput, toolRegistry } from "@/lib/toolRegistry";

describe("tool registry", () => {
  it("contains required metadata for every tool", () => {
    for (const tool of toolRegistry) {
      expect(tool.id.length).toBeGreaterThan(0);
      expect(tool.name.length).toBeGreaterThan(0);
      expect(tool.description.length).toBeGreaterThan(0);
      expect(tool.inputExtensions.length).toBeGreaterThan(0);
      expect(tool.outputExtension.length).toBeGreaterThan(0);
      expect(tool.offlineNotes.length).toBeGreaterThan(0);
      expect(["planned", "beta", "ready"]).toContain(tool.status);
    }
  });

  it("filters by output extension using registry metadata", () => {
    const pdfTools = getToolsByOutput("pdf");
    expect(pdfTools.length).toBeGreaterThan(0);
    expect(pdfTools.every((tool) => tool.outputExtension === "pdf")).toBe(true);
  });

  it("defines defaults for tools with option schemas", () => {
    const withSchema = toolRegistry.filter((tool) => tool.optionSchemaKey !== "none");
    expect(withSchema.length).toBeGreaterThan(0);

    for (const tool of withSchema) {
      const defaults = getToolDefaultOptions(tool);
      expect(defaults).toBeTypeOf("object");
      expect(Array.isArray(defaults)).toBe(false);
    }
  });

  it("exposes rotate-pdf with a selectable angle schema", () => {
    const rotateTool = toolRegistry.find((tool) => tool.id === "rotate-pdf");
    expect(rotateTool).toBeDefined();
    expect(rotateTool?.optionSchemaKey).toBe("rotatePdfOptions");
    expect(getToolDefaultOptions(rotateTool)).toEqual({ angle: 90 });
  });
});
