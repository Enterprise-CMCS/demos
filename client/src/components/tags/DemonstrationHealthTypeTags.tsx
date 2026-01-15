import React from "react";

import { SecondaryButton } from "components/button";
import { ExitIcon } from "components/icons";
import { tw } from "tags/tw";

const STYLES = {
  stepThree: tw`font-bold uppercase tracking-wide text-[#242424] mb-2`,
  helper: tw`text-sm text-text-placeholder mb-1`,
  tagList: tw`flex flex-wrap items-center gap-1 mt-2`,
  tagChip: tw`inline-flex items-center gap-1 rounded-full border border-[#5b616b] bg-surface-white px-1 py-0.75 text-sm text-black`,
  tagRemove: tw`inline-flex items-center justify-center rounded-full w-[15px] h-[15px] bg-[#5b616b]`,
};

export interface DemonstrationHealthTypeTagsProps {
  tags: string[];
  title: string;
  description?: string;
  onRemoveTag: (tag: string) => void;
  onApply: () => void;
}
// We could make this name more generic for reuse.
export const DemonstrationHealthTypeTags = ({
  tags,
  title,
  description,
  onRemoveTag,
  onApply,
}: DemonstrationHealthTypeTagsProps) => {
  return (
    <div aria-labelledby="state-application-tags-title">
      <h4 id="state-application-tags-title" className={STYLES.stepThree}>{title}</h4>
      {description && description.trim() !== "" && (
        <p className={STYLES.helper}>
          {description}
        </p>
      )}
      <div className={STYLES.tagList}>
        {tags.map((tag) => (
          <span key={tag} className={STYLES.tagChip}>
            {tag}
            <button
              type="button"
              className={STYLES.tagRemove}
              onClick={() => onRemoveTag(tag)}
              aria-label={`Remove ${tag}`}
            >
              <ExitIcon height="8" bold={true} className="text-white" />
            </button>
          </span>
        ))}
        <SecondaryButton
          onClick={onApply}
          size="small"
          name="button-apply-application-tags"
          disabled={tags.length === 0}
        >
          Apply Tags
        </SecondaryButton>
      </div>
    </div>
  );
};
