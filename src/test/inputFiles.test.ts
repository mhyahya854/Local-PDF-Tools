import { describe, expect, it } from "vitest";
import {
  createBrowserSelectedFiles,
  createDesktopSelectedFiles,
  mergeSelectedFiles,
  toExecutionInputFiles,
} from "@/lib/inputFiles";

describe("input file helpers", () => {
  it("creates desktop file entries from native paths", () => {
    const [file] = createDesktopSelectedFiles("C:\\docs\\Quarterly Report.pdf");

    expect(file.path).toBe("C:\\docs\\Quarterly Report.pdf");
    expect(file.name).toBe("Quarterly Report.pdf");
    expect(file.source).toBe("desktop");
  });

  it("deduplicates files while preserving order", () => {
    const browserFiles = createBrowserSelectedFiles([
      new File(["a"], "one.pdf", { type: "application/pdf", lastModified: 1 }),
    ]);
    const desktopFiles = createDesktopSelectedFiles(["C:\\docs\\one.pdf", "C:\\docs\\one.pdf"]);

    const merged = mergeSelectedFiles(browserFiles, [...desktopFiles, ...browserFiles]);

    expect(merged).toHaveLength(2);
    expect(merged[0]?.source).toBe("browser");
    expect(merged[1]?.source).toBe("desktop");
  });

  it("maps selected files to execution inputs", () => {
    const files = createDesktopSelectedFiles("C:\\docs\\one.pdf");
    const payload = toExecutionInputFiles(files);

    expect(payload).toEqual([
      {
        name: "one.pdf",
        path: "C:\\docs\\one.pdf",
        sizeBytes: undefined,
      },
    ]);
  });

  it("deduplicates desktop paths case-insensitively", () => {
    const one = createDesktopSelectedFiles("C:\\Docs\\One.pdf");
    const same = createDesktopSelectedFiles("c:/docs/one.pdf");
    const merged = mergeSelectedFiles(one, same);

    expect(merged).toHaveLength(1);
  });
});
