import React from "react";

import { SecondaryButton } from "components/button";
import { tw } from "tags/tw";

const STYLES = {
  stepEyebrow: tw`text-xs font-semibold uppercase tracking-wide text-text-placeholder mb-2`,
  title: tw`text-xl font-semibold mb-2`,
  helper: tw`text-sm text-text-placeholder mb-2`,
  tagList: tw`flex flex-wrap gap-2 mt-3`,
  tagChip: tw`inline-flex items-center gap-2 rounded-full border border-border-fields bg-surface-white px-3 py-1 text-sm`,
  tagRemove: tw`text-text-placeholder hover:text-text-font`,
  tagActions: tw`mt-4 flex items-center gap-3`,
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
      <div className={STYLES.stepEyebrow}>Step 3 - Apply Tags</div>
      <h4 id="state-application-tags-title" className={STYLES.title}>
        APPLY TAGS
      </h4>
      <p className={STYLES.helper}>
        You must tag this application with one or more demonstration types involved in this
        request before it can be reviewed and approved.
      </p>

      <div className="text-sm text-text-placeholder">
        Tag selection will move to a dialog once the flow is ready.
      </div>

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
              x
            </button>
          </span>
        ))}
      </div>

      <div className={STYLES.tagActions}>
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
