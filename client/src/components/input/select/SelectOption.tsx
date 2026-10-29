import React, { useEffect, useRef } from "react";

import { tw } from "tags/tw";

const OPTION_CLASSES = tw`block w-full px-1 py-1 text-left text-sm text-text-font cursor-pointer`;
const OPTION_ACTIVE_CLASSES = tw`bg-surface-focus`;

export const SelectOption = ({
  id,
  testId,
  label,
  value,
  isActive,
  isSelected,
  onSelect,
  onHover,
}: {
  id: string;
  testId: string;
  label: string;
  value: string;
  isActive: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onHover: () => void;
}) => {
  const optionRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isActive) {
      optionRef.current?.scrollIntoView({ block: "nearest" });
    }
  }, [isActive]);

  return (
    <button
      ref={optionRef}
      type="button"
      role="option"
      id={id}
      data-testid={testId}
      value={value}
      tabIndex={-1}
      aria-selected={isSelected}
      className={`${OPTION_CLASSES} ${isActive ? OPTION_ACTIVE_CLASSES : ""}`}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onSelect}
      onMouseEnter={onHover}
    >
      {label}
    </button>
  );
};
