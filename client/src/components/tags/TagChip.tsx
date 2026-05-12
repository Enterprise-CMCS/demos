import { ExitIcon } from "components/icons";
import { Tag } from "demos-server";
import React from "react";
import { tw } from "tags/tw";

const STYLES = {
  baseTagChip: tw`inline-flex items-center gap-1 rounded-full px-1 py-0.75 text-sm text-black`,
  approvedChip: tw`border border-[#5b616b] bg-surface-white`,
  unapprovedChip: tw`border border-yellow-400 bg-yellow-100`,
  suggestionChip: tw`border border-purple-200 bg-purple-50 font-semibold text-purple-700 hover:border-purple-400 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-300 disabled:cursor-not-allowed disabled:opacity-60`,
  tagRemove: tw`inline-flex items-center justify-center rounded-full bg-[#5b616b] cursor-pointer`,
  unapprovedTagRemove: tw`inline-flex items-center justify-center rounded-full w-[15px] h-[15px] bg-yellow-600 cursor-pointer`,
};

type TagChipVariant = "default" | "suggestion";

export const TagChip = ({
  tag,
  onRemoveTag,
  variant = "default",
  icon,
  onClick,
  ariaLabel,
  disabled = false,
}: {
  tag: Tag;
  onRemoveTag?: (tagName: string) => void;
  variant?: TagChipVariant;
  icon?: React.ReactNode;
  onClick?: () => void;
  ariaLabel?: string;
  disabled?: boolean;
}) => {
  const tagName = tag.tagName;
  const isApproved = tag.approvalStatus === "Approved";
  const chipClasses =
    variant === "suggestion"
      ? `${STYLES.baseTagChip} ${STYLES.suggestionChip}`
      : `${STYLES.baseTagChip} ${isApproved ? STYLES.approvedChip : STYLES.unapprovedChip}`;
  const chipText = variant === "suggestion" || isApproved ? tagName : `${tagName} (Unapproved)`;

  if (onClick) {
    return (
      <button
        key={tagName}
        type="button"
        className={chipClasses}
        onClick={onClick}
        aria-label={ariaLabel}
        disabled={disabled}
      >
        {icon}
        {chipText}
      </button>
    );
  }

  return (
    <span key={tagName} className={chipClasses}>
      {icon}
      {chipText}
      {onRemoveTag && (
        <button
          data-testid={`remove-${tagName}-button`}
          type="button"
          className={isApproved ? STYLES.tagRemove : STYLES.unapprovedTagRemove}
          onClick={() => onRemoveTag(tagName)}
          aria-label={`Remove ${tagName}`}
        >
          <ExitIcon height="8" bold={true} className="text-white" />
        </button>
      )}
    </span>
  );
};
