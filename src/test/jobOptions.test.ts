import { describe, expect, it } from "vitest";
import { redactJobOptionsForHistory } from "@/lib/jobOptions";

describe("redactJobOptionsForHistory", () => {
  it("redacts non-empty values for capability-provided sensitive keys", () => {
    const unlock = redactJobOptionsForHistory({ password: "secret" }, ["password"]);
    expect(unlock).toEqual({ password: "[REDACTED]" });

    const protect = redactJobOptionsForHistory(
      {
        userPassword: "user-pass",
        ownerPassword: "owner-pass",
        allowPrint: true,
      },
      ["userPassword", "ownerPassword"],
    );
    expect(protect).toEqual({
      userPassword: "[REDACTED]",
      ownerPassword: "[REDACTED]",
      allowPrint: true,
    });
  });

  it("leaves empty password values untouched", () => {
    const result = redactJobOptionsForHistory({ password: "" }, ["password"]);
    expect(result).toEqual({ password: "" });
  });

  it("does not alter options when no sensitive keys are provided", () => {
    const source = { reverse: true, includeBookmarks: false };
    const result = redactJobOptionsForHistory(source, []);
    expect(result).toEqual(source);
    expect(result).not.toBe(source);
  });
});
