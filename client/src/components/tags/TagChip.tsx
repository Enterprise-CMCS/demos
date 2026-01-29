import { ExitIcon } from "components/icons";
import React from "react";
import { tw } from "tags/tw";

const STYLES = {
  tagChip: tw`inline-flex items-center gap-1 rounded-full border border-[#5b616b] bg-surface-white px-1 py-0.75 text-sm text-black`,
  tagRemove: tw`inline-flex items-center justify-center rounded-full w-[15px] h-[15px] bg-[#5b616b] cursor-pointer`,
};

export const TagChip = ({
  tag,
  onRemoveTag,
}: {
  tag: string;
  onRemoveTag: (tag: string) => void;
}) => {
  return (
    <span key={tag} className={STYLES.tagChip}>
      {tag}
      <button
        data-testid={`remove-${tag}-button`}
        type="button"
        className={STYLES.tagRemove}
        onClick={() => onRemoveTag(tag)}
        aria-label={`Remove ${tag}`}
      >
        <ExitIcon height="8" bold={true} className="text-white" />
      </button>
    </span>
  );
};
