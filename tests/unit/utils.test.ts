import { describe, expect, it } from "vitest";
import { formatApiError } from "@/lib/utils";

describe("formatApiError", () => {
  it("includes status when provided", () => {
    expect(formatApiError("Not found", 404)).toBe("Not found (HTTP 404)");
  });

  it("returns message alone when no status", () => {
    expect(formatApiError("Failed")).toBe("Failed");
  });
});
