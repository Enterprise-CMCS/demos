import { renderHook } from "@testing-library/react";
import { RefObject } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useDropdownPosition } from "./useDropdownPosition";

const makeTriggerRef = (top: number, height = 40): RefObject<HTMLElement> => {
  const element = {
    getBoundingClientRect: () => ({ top, bottom: top + height }) as DOMRect,
    parentElement: null,
  } as unknown as HTMLElement;
  return { current: element };
};

// Builds a trigger nested inside a clipping ancestor (e.g. a modal with
// `overflow-y-auto`) so we can exercise modal-aware — not just viewport — bounds.
const makeTriggerRefInModal = (
  triggerTop: number,
  modalRect: { top: number; bottom: number },
  height = 40
): RefObject<HTMLElement> => {
  const modal = {
    getBoundingClientRect: () => modalRect as DOMRect,
    parentElement: null,
  } as unknown as HTMLElement;
  const element = {
    getBoundingClientRect: () => ({ top: triggerTop, bottom: triggerTop + height }) as DOMRect,
    parentElement: modal,
  } as unknown as HTMLElement;
  vi.spyOn(window, "getComputedStyle").mockReturnValue({
    overflowY: "auto",
  } as CSSStyleDeclaration);
  return { current: element };
};

describe("useDropdownPosition", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("opens downward at full height when there is ample room below", () => {
    vi.stubGlobal("innerHeight", 800);
    const ref = makeTriggerRef(100);

    const { result } = renderHook(() => useDropdownPosition(ref, true));

    expect(result.current.direction).toBe("down");
    expect(result.current.maxHeight).toBe(224);
  });

  it("flips upward when room below is insufficient and there is more room above", () => {
    vi.stubGlobal("innerHeight", 800);
    // Trigger near the bottom: ~60px below, ~740px above.
    const ref = makeTriggerRef(740);

    const { result } = renderHook(() => useDropdownPosition(ref, true));

    expect(result.current.direction).toBe("up");
    expect(result.current.maxHeight).toBe(224);
  });

  it("clamps maxHeight to the available space so options stay scrollable", () => {
    vi.stubGlobal("innerHeight", 300);
    // ~110px below the trigger, ~150px above — flips up; available above = 150 - 2.
    const ref = makeTriggerRef(150);

    const { result } = renderHook(() => useDropdownPosition(ref, true));

    expect(result.current.direction).toBe("up");
    expect(result.current.maxHeight).toBe(148);
  });

  it("clamps to the modal bounds, not the viewport, when below the trigger is clipped", () => {
    // Tall viewport with lots of room below, but the trigger sits near the
    // bottom of a modal that clips at y=460 — the original regression.
    vi.stubGlobal("innerHeight", 900);
    const ref = makeTriggerRefInModal(357, { top: 20, bottom: 460 });

    const { result } = renderHook(() => useDropdownPosition(ref, true));

    // ~63px below within the modal vs ~337px above → flips up, clamped to the
    // modal's upper region rather than the (much larger) viewport space.
    expect(result.current.direction).toBe("up");
    expect(result.current.maxHeight).toBe(224);
  });

  it("opens downward within the modal when there is room below the trigger", () => {
    vi.stubGlobal("innerHeight", 900);
    const ref = makeTriggerRefInModal(100, { top: 20, bottom: 700 });

    const { result } = renderHook(() => useDropdownPosition(ref, true));

    expect(result.current.direction).toBe("down");
    expect(result.current.maxHeight).toBe(224);
  });

  it("defaults to downward at full height while closed", () => {
    vi.stubGlobal("innerHeight", 800);
    const ref = makeTriggerRef(740);

    const { result } = renderHook(() => useDropdownPosition(ref, false));

    expect(result.current.direction).toBe("down");
    expect(result.current.maxHeight).toBe(224);
  });
});
