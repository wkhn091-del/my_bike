import { describe, expect, it } from "vitest";
import { sheetSafe } from "./sheets";

describe("sheetSafe", () => {
  it("neutralises formula prefixes", () => {
    expect(sheetSafe("=HYPERLINK(\"x\")")).toBe("'=HYPERLINK(\"x\")");
    expect(sheetSafe("+972")).toBe("'+972");
    expect(sheetSafe("@cmd")).toBe("'@cmd");
  });
  it("keeps normal values and strips control characters", () => {
    expect(sheetSafe("דנה לוי")).toBe("דנה לוי");
    expect(sheetSafe("a\nb")).toBe("a b");
    expect(sheetSafe(null)).toBe("");
    expect(sheetSafe(3)).toBe("3");
  });
});
