import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Placement = "top" | "bottom";

type TooltipProps = {
  content: React.ReactNode;
  children: React.ReactElement;
  placement?: Placement;
  offset?: number;
  openDelayMs?: number;
};

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  placement = "bottom",
  offset = 8,
  openDelayMs = 150,
}) => {
  const id = useId();
  const triggerRef = useRef<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const timer = useRef<number | null>(null);

  const clearTimer = () => {
    if (timer.current) globalThis.clearTimeout(timer.current);
    timer.current = null;
  };

  const show = () => {
    clearTimer();
    timer.current = globalThis.setTimeout(() => setOpen(true), openDelayMs);
  };

  const hide = () => {
    clearTimer();
    setOpen(false);
  };

  const updatePosition = () => {
    const t = triggerRef.current;
    const tip = tooltipRef.current;
    if (!t || !tip) return;

    const r = t.getBoundingClientRect();
    const tr = tip.getBoundingClientRect();

    const left = Math.max(8, Math.min(globalThis.innerWidth - tr.width - 8, r.left + (r.width - tr.width) / 2));
    const top =
      placement === "top"
        ? Math.max(8, r.top - tr.height - offset)
        : Math.min(globalThis.innerHeight - tr.height - 8, r.bottom + offset);

    setPos({ top, left });
  };

  useEffect(() => {
    if (!open) return;

    updatePosition();
    const onScroll = () => updatePosition();
    const onResize = () => updatePosition();
    globalThis.addEventListener("scroll", onScroll, true);
    globalThis.addEventListener("resize", onResize);

    return () => {
      globalThis.removeEventListener("scroll", onScroll, true);
      globalThis.removeEventListener("resize", onResize);
    };
  }, [open, placement, offset]);

  const wrappedChild = useMemo(() => {
    const existingProps = children.props as Record<string, unknown>;

    // Create a safe clone with proper typing
    const enhancedProps = {
      ...existingProps,
      "aria-describedby": id,
      onMouseEnter: (e: React.MouseEvent) => {
        if (typeof existingProps.onMouseEnter === "function") {
          existingProps.onMouseEnter(e);
        }
        show();
      },
      onMouseLeave: (e: React.MouseEvent) => {
        if (typeof existingProps.onMouseLeave === "function") {
          existingProps.onMouseLeave(e);
        }
        hide();
      },
      onFocus: (e: React.FocusEvent) => {
        if (typeof existingProps.onFocus === "function") {
          existingProps.onFocus(e);
        }
        show();
      },
      onBlur: (e: React.FocusEvent) => {
        if (typeof existingProps.onBlur === "function") {
          existingProps.onBlur(e);
        }
        hide();
      },
    };

    // Handle ref forwarding
    const originalRef = (children as React.ReactElement & { ref?: React.Ref<HTMLElement> }).ref;
    const combinedRef = (node: HTMLElement | null) => {
      triggerRef.current = node;

      if (typeof originalRef === "function") {
        originalRef(node);
      } else if (originalRef && typeof originalRef === "object" && "current" in originalRef) {
        (originalRef as { current: HTMLElement | null }).current = node;
      }
    };

    // Clone with proper type handling
    return React.cloneElement(
      children,
      { ...enhancedProps, ref: combinedRef } as React.HTMLAttributes<HTMLElement>
    );
  }, [children, id, show, hide]);

  if (!content) return children;

  return (
    <>
      {wrappedChild}
      {open &&
        createPortal(
          <div
            ref={tooltipRef}
            id={id}
            role="tooltip"
            className="z-[1000] rounded bg-gray-900 px-3 py-2 text-sm text-white shadow-lg"
            style={{ position: "fixed", top: pos.top, left: pos.left }}
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
};
