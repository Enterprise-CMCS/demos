import React from "react";

import { SecondaryButton } from "components/button";
import { useDialog } from "components/dialog/DialogContext";
import { tw } from "tags/tw";
import { TagChip } from "./TagChip";
import { DEMONSTRATION_TYPE_TAGS } from "demos-server-constants";

const STYLES = {
  stepThree: tw`font-bold uppercase tracking-wide text-[#242424] mb-2`,
  helper: tw`text-sm text-text-placeholder mb-1`,
  tagList: tw`flex flex-wrap items-center gap-1 mt-2`,
};

export interface DemonstrationHealthTypeTagsProps {
  demonstrationId: string;
  selectedTags: string[];
  title: string;
  description?: string;
  onRemoveTag: (tag: string) => void;
}
// We could make this name more generic for reuse.
export const DemonstrationHealthTypeTags = ({
  demonstrationId,
  selectedTags,
  title,
  description,
  onRemoveTag,
}: DemonstrationHealthTypeTagsProps) => {
  const { showApplyTagsDialog } = useDialog();

  const handleApplyClick = () => {
    showApplyTagsDialog(demonstrationId, DEMONSTRATION_TYPE_TAGS, selectedTags);
  };

  return (
    <div aria-labelledby="state-application-tags-title">
      <h4 id="state-application-tags-title" className={STYLES.stepThree}>
        {title}
      </h4>
      {description && description.trim() !== "" && <p className={STYLES.helper}>{description}</p>}
      <div className={STYLES.tagList}>
        {selectedTags.map((tag) => (
          <TagChip key={tag} tag={tag} onRemoveTag={onRemoveTag} />
        ))}
        <SecondaryButton
          size="small"
          name="button-apply-application-tags"
          onClick={handleApplyClick}
        >
          Apply Tags
        </SecondaryButton>
      </div>
    </div>
  );
};
