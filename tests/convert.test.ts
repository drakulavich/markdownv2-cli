import { describe, expect, test } from "bun:test";
import { convertToMarkdownV2 } from "../src/convert.ts";

describe("convertToMarkdownV2", () => {
  test("escapes plain punctuation in MarkdownV2", () => {
    const out = convertToMarkdownV2("Hello, world!");
    // MarkdownV2 requires escaping ! and ,
    expect(out).toContain("\\!");
  });

  test("converts bold from ** to *", () => {
    const out = convertToMarkdownV2("**bold**");
    expect(out).toContain("*bold*");
  });

  test("escapes link URL special characters", () => {
    const out = convertToMarkdownV2("[v1.0.0](http://example.com)");
    expect(out).toMatch(/\[v1\\\.0\\\.0\]\(http:\/\/example\.com\)/);
  });

  test("returns string for empty markdown", () => {
    const out = convertToMarkdownV2("");
    expect(typeof out).toBe("string");
  });
});
