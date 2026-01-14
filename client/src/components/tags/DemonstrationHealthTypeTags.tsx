import React from "react";

import { SecondaryButton } from "components/button";
import { ExitIcon } from "components/icons";
import { tw } from "tags/tw";

const STYLES = {
  stepThree: tw`font-bold uppercase tracking-wide text-text-placeholder mb-2`,
  helper: tw`text-sm text-text-placeholder mb-1`,
  tagList: tw`flex flex-wrap items-center gap-2 mt-2`,
  tagChip: tw`inline-flex items-center gap-1 rounded-full border border-border-fields bg-surface-white px-1 py-0.75 text-sm`,
  tagRemove: tw`inline-flex items-center justify-center rounded-full w-[15px] h-[15px] bg-[#5b616b]`,
};

export interface DemonstrationHealthTypeTagsProps {
  tags: string[];
  onRemoveTag: (tag: string) => void;
  onApply: () => void;
}

export const DemonstrationHealthTypeTags = ({
  tags,
  onRemoveTag,
  onApply,
}: DemonstrationHealthTypeTagsProps) => {
  return (
    <div aria-labelledby="state-application-tags-title">
      <h4 id="state-application-tags-title" className={STYLES.stepThree}>Step 3 - Apply Tags</h4>
      <p className={STYLES.helper}>
        You must tag this application with one or more demonstration types involved in this
        request before it can be reviewed and approved.
      </p>

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
              <ExitIcon height="8" className="text-white" />
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
