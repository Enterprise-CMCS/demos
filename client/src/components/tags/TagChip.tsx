import { ExitIcon } from "components/icons";
import { Tag } from "demos-server";
import React from "react";
import { tw } from "tags/tw";

const STYLES = {
  baseTagChip: tw`inline-flex items-center gap-1 rounded-full border border-[#5b616b] px-1 py-0.75 text-sm text-black`,
  tagRemove: tw`inline-flex items-center justify-center rounded-full w-[15px] h-[15px] bg-[#5b616b] cursor-pointer`,
};

export const TagChip = ({
  tag,
  onRemoveTag,
}: {
  tag: Tag;
  onRemoveTag: (tagName: string) => void;
}) => {
  const tagName = tag.tagName;
  const isApproved = tag.approvalStatus === "Approved";
  return (
    <span
      key={tagName}
      className={`${STYLES.baseTagChip}${isApproved ? " bg-surface-white" : " bg-border-alert"}`}
    >
      {`${tagName}${isApproved ? "" : " (Unapproved)"}`}
      <button
        data-testid={`remove-${tagName}-button`}
        type="button"
        className={STYLES.tagRemove}
        onClick={() => onRemoveTag(tagName)}
        aria-label={`Remove ${tagName}`}
      >
        <ExitIcon height="8" bold={true} className="text-white" />
      </button>
    </span>
  );
};
