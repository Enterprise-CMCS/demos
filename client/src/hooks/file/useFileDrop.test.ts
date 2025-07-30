import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFileDrop } from "./useFileDrop";

describe("useFileDrop", () => {
  it("prevents default and stops propagation on drag over", () => {
    const { result } = renderHook(() => useFileDrop(() => {}));
    const preventDefault = vi.fn();
    const stopPropagation = vi.fn();
    const event = { preventDefault, stopPropagation } as unknown as React.DragEvent<HTMLElement>;
    act(() => {
      result.current.handleDragOver(event);
    });
    expect(preventDefault).toHaveBeenCalled();
    expect(stopPropagation).toHaveBeenCalled();
  });

  it("calls onFiles with files on drop", () => {
    const onFiles = vi.fn();
    const { result } = renderHook(() => useFileDrop(onFiles));
    const file = new File(["foo"], "foo.txt", { type: "text/plain" });
    const preventDefault = vi.fn();
    const stopPropagation = vi.fn();
    const event = {
      preventDefault,
      stopPropagation,
      dataTransfer: { files: [file], length: 1 },
    } as unknown as React.DragEvent<HTMLElement>;
    act(() => {
      result.current.handleDrop(event);
    });
    expect(preventDefault).toHaveBeenCalled();
    expect(stopPropagation).toHaveBeenCalled();
    expect(onFiles).toHaveBeenCalledWith([file]);
  });

  it("does not call onFiles if no files are dropped", () => {
    const onFiles = vi.fn();
    const { result } = renderHook(() => useFileDrop(onFiles));
    const preventDefault = vi.fn();
    const stopPropagation = vi.fn();
    const event = {
      preventDefault,
      stopPropagation,
      dataTransfer: { files: [], length: 0 },
    } as unknown as React.DragEvent<HTMLElement>;
    act(() => {
      result.current.handleDrop(event);
    });
    expect(onFiles).not.toHaveBeenCalled();
  });
});
