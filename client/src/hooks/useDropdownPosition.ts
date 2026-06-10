import { RefObject, useLayoutEffect, useState } from "react";

// Matches the `max-h-56` (14rem) cap applied to dropdown option lists.
const DROPDOWN_MAX_HEIGHT_PX = 224;
// Gap between the trigger and the list (matches the `mt-0.5`/`mb-0.5` = 2px).
const GAP_PX = 2;

export interface DropdownPosition {
  direction: "up" | "down";
  maxHeight: number;
}

const isClippingOverflow = (overflow: string) =>
  overflow === "auto" || overflow === "scroll" || overflow === "hidden";

/**
 * Finds the vertical bounds within which the dropdown must stay visible. The
 * list (positioned `absolute` inside its trigger's container) can be clipped by
 * any scrollable/overflow-hidden ancestor (e.g. a dialog with `overflow-y-auto`),
 * not just the viewport, so we walk up the tree and tighten the bounds against
 * every clipping ancestor.
 */
const getClippingBounds = (element: HTMLElement): { top: number; bottom: number } => {
  let top = 0;
  let bottom = window.innerHeight;

  let ancestor = element.parentElement;
  while (ancestor) {
    const { overflowY } = window.getComputedStyle(ancestor);
    if (isClippingOverflow(overflowY)) {
      const rect = ancestor.getBoundingClientRect();
      top = Math.max(top, rect.top);
      bottom = Math.min(bottom, rect.bottom);
    }
    ancestor = ancestor.parentElement;
  }

  return { top, bottom };
};

/**
 * Decides whether a dropdown list should open upward or downward, and how tall
 * it may be, so its options stay fully visible inside its clipping context (the
 * viewport and any overflow-clipping ancestor such as a modal).
 *
 * The list opens toward whichever side has more room. `maxHeight` is clamped to
 * the available space on that side (capped at the `max-h-56` design limit) so a
 * tight space scrolls the options rather than spilling past the modal edge.
 *
 * Recomputes on scroll and resize so the list keeps fitting as the modal moves.
 *
 * @param triggerRef - Ref to the element the list anchors to (e.g. the input)
 * @param isOpen - Whether the dropdown is currently open
 */
export function useDropdownPosition(
  triggerRef: RefObject<HTMLElement | null>,
  isOpen: boolean
): DropdownPosition {
  const [position, setPosition] = useState<DropdownPosition>({
    direction: "down",
    maxHeight: DROPDOWN_MAX_HEIGHT_PX,
  });

  useLayoutEffect(() => {
    if (!isOpen) return;

    const trigger = triggerRef.current;
    if (!trigger) return;

    const update = () => {
      const { top, bottom } = trigger.getBoundingClientRect();
      const bounds = getClippingBounds(trigger);
      const spaceBelow = bounds.bottom - bottom;
      const spaceAbove = top - bounds.top;

      const openUp = spaceBelow < DROPDOWN_MAX_HEIGHT_PX && spaceAbove > spaceBelow;
      const available = (openUp ? spaceAbove : spaceBelow) - GAP_PX;
      const maxHeight = Math.max(0, Math.min(DROPDOWN_MAX_HEIGHT_PX, available));

      setPosition({ direction: openUp ? "up" : "down", maxHeight });
    };

    update();
    // Capture phase so scrolling inside the modal (not just the window) is caught.
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [isOpen, triggerRef]);

  return position;
}
