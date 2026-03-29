import { describe, it, expect } from "vitest";

import { getPaginationParams } from "../utils/pagination";

describe("getPaginationParams", () => {
  describe("defaults", () => {
    it("returns page=1, limit=20, offset=0 when no params provided", () => {
      const result = getPaginationParams({});
      expect(result).toEqual({ page: 1, limit: 20, offset: 0 });
    });

    it("returns page=1, limit=20, offset=0 for undefined values", () => {
      const result = getPaginationParams({ page: undefined, limit: undefined });
      expect(result).toEqual({ page: 1, limit: 20, offset: 0 });
    });
  });

  describe("page parsing", () => {
    it("parses string page numbers", () => {
      const result = getPaginationParams({ page: "3" });
      expect(result.page).toBe(3);
      expect(result.offset).toBe(40);
    });

    it("parses numeric page values", () => {
      const result = getPaginationParams({ page: 5 });
      expect(result.page).toBe(5);
      expect(result.offset).toBe(80);
    });

    it("clamps page to minimum of 1 for zero", () => {
      const result = getPaginationParams({ page: "0" });
      expect(result.page).toBe(1);
    });

    it("clamps page to minimum of 1 for negative values", () => {
      const result = getPaginationParams({ page: "-5" });
      expect(result.page).toBe(1);
    });

    it("falls back to 1 for non-numeric strings", () => {
      const result = getPaginationParams({ page: "abc" });
      expect(result.page).toBe(1);
    });

    it("falls back to 1 for null", () => {
      const result = getPaginationParams({ page: null });
      expect(result.page).toBe(1);
    });
  });

  describe("limit parsing", () => {
    it("parses string limit numbers", () => {
      const result = getPaginationParams({ limit: "50" });
      expect(result.limit).toBe(50);
    });

    it("parses numeric limit values", () => {
      const result = getPaginationParams({ limit: 10 });
      expect(result.limit).toBe(10);
    });

    it("falls back to default 20 when limit is 0 (falsy)", () => {
      const result = getPaginationParams({ limit: "0" });
      expect(result.limit).toBe(20);
    });

    it("clamps limit to minimum of 1 for negative values", () => {
      const result = getPaginationParams({ limit: "-10" });
      expect(result.limit).toBe(1);
    });

    it("clamps limit to maximum of 100", () => {
      const result = getPaginationParams({ limit: "200" });
      expect(result.limit).toBe(100);
    });

    it("clamps limit to maximum of 100 for very large values", () => {
      const result = getPaginationParams({ limit: "99999" });
      expect(result.limit).toBe(100);
    });

    it("falls back to 20 for non-numeric strings", () => {
      const result = getPaginationParams({ limit: "xyz" });
      expect(result.limit).toBe(20);
    });
  });

  describe("offset calculation", () => {
    it("calculates offset correctly for page 1", () => {
      const result = getPaginationParams({ page: "1", limit: "10" });
      expect(result.offset).toBe(0);
    });

    it("calculates offset correctly for page 2", () => {
      const result = getPaginationParams({ page: "2", limit: "10" });
      expect(result.offset).toBe(10);
    });

    it("calculates offset correctly for large page numbers", () => {
      const result = getPaginationParams({ page: "10", limit: "25" });
      expect(result.offset).toBe(225);
    });
  });

  describe("edge cases", () => {
    it("handles limit at exact boundary of 100", () => {
      const result = getPaginationParams({ limit: "100" });
      expect(result.limit).toBe(100);
    });

    it("handles limit at exact boundary of 1", () => {
      const result = getPaginationParams({ limit: "1" });
      expect(result.limit).toBe(1);
    });

    it("handles float strings by truncating to integer", () => {
      const result = getPaginationParams({ page: "2.7", limit: "10.9" });
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
    });
  });
});
