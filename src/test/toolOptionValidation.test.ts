import { describe, expect, it } from "vitest";
import { getToolById } from "@/lib/toolRegistry";
import { validateToolOptions } from "@/lib/toolOptionValidation";

describe("validateToolOptions", () => {
  it("rejects malformed split ranges", () => {
    const tool = getToolById("split-pdf");
    expect(tool).toBeDefined();

    const result = validateToolOptions(tool!, {
      mode: "range",
      ranges: "8-2",
      everyNPages: 2,
    });

    expect(result.isValid).toBe(false);
    expect(result.errors[0]?.code).toBe("SPLIT_RANGE_INVALID");
  });

  it("rejects missing protect passwords", () => {
    const tool = getToolById("protect-pdf");
    expect(tool).toBeDefined();

    const result = validateToolOptions(tool!, {
      userPassword: "",
      ownerPassword: "",
      allowPrint: true,
      allowCopy: false,
    });

    expect(result.isValid).toBe(false);
    expect(result.errors[0]?.code).toBe("PROTECT_PASSWORD_REQUIRED");
  });

  it("rejects unsupported rotate angles", () => {
    const tool = getToolById("rotate-pdf");
    expect(tool).toBeDefined();

    const result = validateToolOptions(tool!, {
      angle: 45,
    });

    expect(result.isValid).toBe(false);
    expect(result.errors[0]?.code).toBe("ROTATE_ANGLE_INVALID");
  });

  it("accepts valid runnable option payloads", () => {
    const splitTool = getToolById("split-pdf");
    expect(splitTool).toBeDefined();

    const splitResult = validateToolOptions(splitTool!, {
      mode: "every",
      ranges: "",
      everyNPages: 3,
    });
    expect(splitResult.isValid).toBe(true);

    const rotateTool = getToolById("rotate-pdf");
    expect(rotateTool).toBeDefined();

    const rotateResult = validateToolOptions(rotateTool!, {
      angle: 180,
    });
    expect(rotateResult.isValid).toBe(true);

    const protectTool = getToolById("protect-pdf");
    expect(protectTool).toBeDefined();

    const protectResult = validateToolOptions(protectTool!, {
      userPassword: "reader",
      ownerPassword: "owner-secret",
      allowPrint: true,
      allowCopy: false,
    });
    expect(protectResult.isValid).toBe(true);
  });

  it("rejects identical protect passwords", () => {
    const tool = getToolById("protect-pdf");
    expect(tool).toBeDefined();

    const result = validateToolOptions(tool!, {
      userPassword: "same-secret",
      ownerPassword: "same-secret",
      allowPrint: true,
      allowCopy: false,
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.some((error) => error.code === "PROTECT_PASSWORD_DISTINCT")).toBe(true);
  });
});
