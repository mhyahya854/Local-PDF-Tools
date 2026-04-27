import { describe, expect, it } from "vitest";
import { getToolById } from "@/lib/toolRegistry";
import { validateFilesForTool } from "@/lib/fileValidation";
import { createBrowserSelectedFiles, createDesktopSelectedFiles } from "@/lib/inputFiles";

describe("file validation", () => {
  it("accepts valid input files for merge tool", () => {
    const tool = getToolById("merge-pdf");
    expect(tool).toBeDefined();

    const files = createBrowserSelectedFiles([
      new File(["a"], "one.pdf", { type: "application/pdf" }),
      new File(["b"], "two.pdf", { type: "application/pdf" }),
    ]);

    const result = validateFilesForTool(files, tool!);
    expect(result.isValid).toBe(true);
    expect(result.acceptedFiles).toHaveLength(2);
  });

  it("rejects unsupported extensions", () => {
    const tool = getToolById("merge-pdf");
    expect(tool).toBeDefined();

    const files = createBrowserSelectedFiles([
      new File(["not pdf"], "notes.docx", { type: "application/octet-stream" }),
    ]);
    const result = validateFilesForTool(files, tool!);

    expect(result.isValid).toBe(false);
    expect(result.rejectedFiles).toHaveLength(1);
  });

  it("rejects desktop files that do not include a readable path", () => {
    const tool = getToolById("merge-pdf");
    expect(tool).toBeDefined();

    const [desktopFile] = createDesktopSelectedFiles("C:\\docs\\one.pdf");
    const result = validateFilesForTool([{ ...desktopFile, path: undefined }], tool!);

    expect(result.isValid).toBe(false);
    expect(result.rejectedFiles[0]?.reason).toContain("readable local file path");
  });
});
