import { describe, it, expect } from "vitest";

import { GenericSourceTypeStrategy } from "../services/sourceTypeStrategy";

describe("GenericSourceTypeStrategy", () => {
  const strategy = new GenericSourceTypeStrategy();

  describe("known hostnames", () => {
    it.each([
      ["github.com", "github"],
      ["youtube.com", "youtube"],
      ["youtu.be", "youtube"],
      ["twitter.com", "twitter"],
      ["x.com", "twitter"],
      ["instagram.com", "instagram"],
      ["reddit.com", "reddit"],
      ["amazon.com", "amazon"],
      ["arxiv.org", "academic"],
      ["scholar.google.com", "academic"],
    ])("detects %s as %s", (hostname, expected) => {
      expect(strategy.detect(hostname)).toBe(expected);
    });
  });

  describe("unknown hostnames", () => {
    it("returns null for an unknown hostname", () => {
      expect(strategy.detect("example.com")).toBeNull();
    });

    it("returns null for an empty string", () => {
      expect(strategy.detect("")).toBeNull();
    });

    it("returns null for a subdomain variant not in the map", () => {
      expect(strategy.detect("m.youtube.com")).toBeNull();
    });

    it("returns null for a similar but different domain", () => {
      expect(strategy.detect("github.io")).toBeNull();
    });
  });
});
