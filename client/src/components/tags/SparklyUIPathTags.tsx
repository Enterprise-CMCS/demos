import React from "react";

import { SparklyIcon } from "components/icons";
import { Tag, TagName } from "demos-server";
import { tw } from "tags/tw";
import { TagChip } from "./TagChip";

const STYLES = {
  wrapper: tw`mt-6 border-t border-dashed border-border-rules pt-4`,
  label: tw`mb-2 text-xs font-bold uppercase tracking-wide text-purple-700`,
  list: tw`flex flex-wrap gap-1`,
};

export type SparklyUIPathTagsProps = {
  selectedTags: Tag[];
  suggestedTags: TagName[];
  onAcceptSuggestion: (tagName: TagName) => void;
  isApplyingSuggestion?: boolean;
};

export const SparklyUIPathTags = ({
  selectedTags,
  suggestedTags,
  onAcceptSuggestion,
  isApplyingSuggestion = false,
}: SparklyUIPathTagsProps) => {
  const selectedTagNames = new Set(selectedTags.map((tag) => tag.tagName));
  const visibleSuggestions = suggestedTags.filter((tagName) => !selectedTagNames.has(tagName));

  if (visibleSuggestions.length === 0) return null;

  return (
    <div className={STYLES.wrapper}>
      <div className={STYLES.label}>DEMOS AI SUGGESTIONS</div>
      <div className={STYLES.list}>
        {visibleSuggestions.map((tagName) => (
          <TagChip
            key={tagName}
            tag={{ tagName, approvalStatus: "Approved" }}
            variant="suggestion"
            icon={<SparklyIcon label="Suggested by DEMOS AI" className="shrink-0" />}
            onClick={() => onAcceptSuggestion(tagName)}
            ariaLabel={`Apply suggested tag ${tagName}`}
            disabled={isApplyingSuggestion}
          />
        ))}
      </div>
    </div>
  );
};
