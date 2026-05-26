import { describe, expect, it, vi } from "vitest";
import { triggerFaqDownload } from "./triggerFaqDownload";

describe("triggerFaqDownload", () => {
  it("creates, clicks, and removes a download link", () => {
    const link = document.createElement("a");
    const createElementSpy = vi.spyOn(document, "createElement").mockReturnValue(link);
    const appendChildSpy = vi.spyOn(document.body, "appendChild");
    const removeChildSpy = vi.spyOn(document.body, "removeChild");
    const clickSpy = vi.spyOn(link, "click").mockImplementation(() => {});

    triggerFaqDownload("https://example.com/faq.pdf?signature=abc123");

    expect(createElementSpy).toHaveBeenCalledExactlyOnceWith("a");
    expect(link.href).toBe("https://example.com/faq.pdf?signature=abc123");
    expect(link.rel).toBe("noopener noreferrer");
    expect(appendChildSpy).toHaveBeenCalledExactlyOnceWith(link);
    expect(clickSpy).toHaveBeenCalledExactlyOnceWith();
    expect(removeChildSpy).toHaveBeenCalledExactlyOnceWith(link);
  });
});
