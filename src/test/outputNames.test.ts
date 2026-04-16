import { describe, expect, it } from "vitest";
import { buildOutputFilename } from "@/lib/outputNames";

describe("output filename generation", () => {
  it("builds deterministic names for single-file output", () => {
    const value = buildOutputFilename({
      toolId: "merge-pdf",
      outputExtension: "pdf",
      inputFileNames: ["Quarterly Report.pdf"],
    });

    expect(value).toBe("quarterly-report-merge-pdf.pdf");
  });

  it("builds stamped names for multi-file output", () => {
    const value = buildOutputFilename({
      toolId: "merge-pdf",
      outputExtension: "pdf",
      inputFileNames: ["a.pdf", "b.pdf"],
      timestamp: new Date("2026-04-16T12:34:56Z"),
    });

    expect(value).toBe("merge-pdf-20260416123456.pdf");
  });
});
