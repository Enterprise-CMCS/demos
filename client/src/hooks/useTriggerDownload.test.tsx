import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useTriggerDownload } from "./useTriggerDownload";

describe("useTriggerDownload", () => {
  it("creates, clicks, and removes a download link", () => {
    const { result } = renderHook(() => useTriggerDownload());
    const initialChildCount = document.body.childElementCount;
    const appendChildSpy = vi.spyOn(document.body, "appendChild");
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    result.current.triggerDownload("https://example.com/reference.pdf?signature=abc123");

    const appendedLink = appendChildSpy.mock.calls[0]?.[0] as HTMLAnchorElement;

    expect(appendedLink.tagName).toBe("A");
    expect(appendedLink.href).toBe("https://example.com/reference.pdf?signature=abc123");
    expect(appendedLink.rel).toBe("noopener noreferrer");
    expect(clickSpy).toHaveBeenCalledExactlyOnceWith();
    expect(document.body.childElementCount).toBe(initialChildCount);
  });
});
