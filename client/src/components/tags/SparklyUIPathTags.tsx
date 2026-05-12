import React from "react";

import { Tag, TagName } from "demos-server";
import { tw } from "tags/tw";
import { TagChip } from "./TagChip";

const STYLES = {
  wrapper: tw`mt-6 border-t border-dashed border-border-rules pt-4`,
  label: tw`mb-2 text-xs font-bold uppercase tracking-wide text-purple-700`,
  list: tw`flex flex-wrap gap-1`,
};

const SparkleIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className="shrink-0"
  >
    <path
      d="M6.5 1.5 7.8 5 11.3 6.3 7.8 7.6 6.5 11.1 5.2 7.6 1.7 6.3 5.2 5 6.5 1.5Z"
      fill="currentColor"
    />
    <path
      d="M12.2 1.7 12.8 3.3 14.3 3.8 12.8 4.4 12.2 6 11.7 4.4 10.1 3.8 11.7 3.3 12.2 1.7Z"
      fill="currentColor"
    />
    <path
      d="M12 9.3 12.7 11.2 14.6 11.9 12.7 12.6 12 14.5 11.3 12.6 9.4 11.9 11.3 11.2 12 9.3Z"
      fill="currentColor"
    />
  </svg>
);

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
            icon={<SparkleIcon />}
            onClick={() => onAcceptSuggestion(tagName)}
            ariaLabel={`Apply suggested tag ${tagName}`}
            disabled={isApplyingSuggestion}
          />
        ))}
      </div>
    </div>
  );
};
