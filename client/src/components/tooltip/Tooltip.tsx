import React, { useEffect, useRef } from "react";
import { tw } from "tags/tw";

const TOOLTIP_STYLES = tw`
bg-black
text-white
text-sm
px-2
py-1
rounded
m-0
border-0
[position-anchor:var(--anchor)]
[top:anchor(bottom)]
[left:anchor(left)]
mt-1
`;

export const Tooltip: React.FC<{
  id: string;
  anchorName: string;
  anchorRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
}> = ({ id, anchorName, anchorRef, children }) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const anchor = anchorRef.current;
    const popover = popoverRef.current;
    if (!anchor || !popover) return;

    const show = () => popover.showPopover();
    const hide = () => popover.hidePopover();

    anchor.addEventListener("mouseenter", show);
    anchor.addEventListener("mouseleave", hide);
    anchor.addEventListener("focus", show);
    anchor.addEventListener("blur", hide);

    return () => {
      anchor.removeEventListener("mouseenter", show);
      anchor.removeEventListener("mouseleave", hide);
      anchor.removeEventListener("focus", show);
      anchor.removeEventListener("blur", hide);
    };
  }, [anchorRef]);

  return (
    <div
      ref={popoverRef}
      id={id}
      role="tooltip"
      popover="manual"
      className={TOOLTIP_STYLES}
      style={{ "--anchor": anchorName } as React.CSSProperties}
    >
      {children}
    </div>
  );
};
