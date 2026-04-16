import { describe, expect, it } from "vitest";
import { normalizePageRanges, parsePageRanges } from "@/lib/pageRanges";

describe("page range parsing", () => {
  it("parses list and range syntax", () => {
    expect(parsePageRanges("1,3,5-7")).toEqual([1, 3, 5, 6, 7]);
  });

  it("normalizes page ranges", () => {
    expect(normalizePageRanges("1,2,3,7,8")).toBe("1-3,7-8");
  });

  it("throws on malformed ranges", () => {
    expect(() => parsePageRanges("8-2")).toThrowError();
    expect(() => parsePageRanges("abc")).toThrowError();
  });
});
