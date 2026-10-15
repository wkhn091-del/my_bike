import { describe, expect, it } from "vitest";
import { ageOn, escapeHtml, formatShekels, inPlace } from "./format";

describe("format", () => {
  it("drops the definite article after ב", () => {
    expect(inPlace("הגליל")).toBe("בגליל");
    expect(inPlace("הגולן")).toBe("בגולן");
    expect(inPlace("עמק יזרעאל")).toBe("בעמק יזרעאל");
  });

  it("formats agorot as shekels", () => {
    expect(formatShekels(69_000)).toBe("690 ₪");
    expect(formatShekels(69_050)).toBe("690.50 ₪");
  });

  it("computes age on the event date", () => {
    expect(ageOn("2010-01-08", "2027-01-08")).toBe(17);
    expect(ageOn("2010-01-09", "2027-01-08")).toBe(16);
    expect(ageOn("2009-01-08", "2027-01-08")).toBe(18);
  });

  it("escapes HTML for email templates", () => {
    expect(escapeHtml(`<img src=x onerror="a">'`)).toBe("&lt;img src=x onerror=&quot;a&quot;&gt;&#39;");
  });
});
