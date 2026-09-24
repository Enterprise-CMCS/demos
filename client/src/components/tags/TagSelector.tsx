import React, { useState } from "react";
import { Tag } from "demos-server";
import { Checkbox } from "components/input";
import { Input, INPUT_BASE_CLASSES, getInputColors } from "components/input/Input";
import { WarningIcon, ErrorIcon, LabelIcon, SearchIcon } from "components/icons";
import { tw } from "tags/tw";
import { NO_MATCH_MESSAGE, UNAPPROVED_WARNING_MESSAGE } from "util/messages";

const STYLES = {
  applyTagLabel: tw`flex items-center gap-1 p-1 cursor-pointer hover:bg-gray-50 rounded border-b border-border-rules`,
  applyTagList: tw`flex flex-col border border-border-rules max-h-64 overflow-y-auto`,
  tagLabel: tw`flex items-center gap-1 p-1 hover:bg-surface-secondary`,
  tagList: tw`flex flex-col border border-border-rules rounded-minimal h-64 max-h-[35vh] overflow-y-auto`,
};

const CREATE_TAG_BUTTON_CLASSES = tw`
  inline-flex items-center justify-center gap-xs
  font-semibold text-[14px] px-[16px] py-[12px]
  rounded-md border border-action text-action bg-white
  hover:bg-action hover:text-white
  focus:outline-none focus:ring-2 focus:ring-action-focus
  transition-all cursor-pointer whitespace-nowrap
  disabled:bg-gray-200 disabled:border-border-rules
  disabled:text-text-placeholder disabled:cursor-not-allowed
`;

const SearchField = ({
  searchQuery,
  setSearchQuery,
  onCreateTag,
  canCreateTag,
  placeholder,
  showLabel,
}: {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onCreateTag: () => void;
  canCreateTag: boolean;
  placeholder: string;
  showLabel: boolean;
}) => {
  return (
    <div className="flex gap-2 items-end">
      {showLabel ? (
        <div className="flex-1">
          <Input
            name="input-apply-tags-search"
            type="text"
            label="Demonstration Type"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            isRequired={true}
          />
        </div>
      ) : (
        <div className="relative flex flex-1 min-w-0 items-center">
          <SearchIcon className="absolute left-1 text-text-placeholder pointer-events-none" />
          <input
            id="input-apply-tags-search"
            name="input-apply-tags-search"
            data-testid="input-apply-tags-search"
            type="text"
            aria-label="Search demonstration types"
            className={`${INPUT_BASE_CLASSES} ${getInputColors("")} w-full pl-10`}
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}
      <button
        data-testid="button-create-tag"
        name="button-create-tag"
        type="button"
        disabled={!canCreateTag}
        onClick={onCreateTag}
        className={CREATE_TAG_BUTTON_CLASSES}
      >
        Create Tag
        <LabelIcon />
      </button>
    </div>
  );
};

export const TagSelector = ({
  allTags,
  selectedTags,
  setSelectedTags,
  variant,
}: {
  allTags: Tag[];
  selectedTags: Tag[];
  setSelectedTags: (tags: Tag[]) => void;
  variant: "apply" | "improve";
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [createdTags, setCreatedTags] = useState<Tag[]>([]);

  const isSingleSelect = variant === "improve";

  const handleToggleTag = (targetTag: Tag) => {
    if (selectedTags.map((tag) => tag.tagName).includes(targetTag.tagName)) {
      setSelectedTags(selectedTags.filter((tag) => tag.tagName !== targetTag.tagName));
    } else {
      setSelectedTags(isSingleSelect ? [targetTag] : [...selectedTags, targetTag]);
    }
  };

  // Dedupe by tagName — createdTags spread first so new tags appear at the top.
  const seen = new Set<string>();
  const mergedTags = [...createdTags, ...allTags].filter((tag) => {
    if (seen.has(tag.tagName)) return false;
    seen.add(tag.tagName);
    return true;
  });

  const filteredTags = mergedTags.filter((tag) =>
    tag.tagName.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const hasExactMatch =
    normalizedSearchQuery.length > 0 &&
    mergedTags.some((tag) => tag.tagName.trim().toLowerCase() === normalizedSearchQuery);
  const hasMatches = filteredTags.length > 0 || searchQuery.trim().length === 0;
  const canCreateTag =
    normalizedSearchQuery.length > 0 && (isSingleSelect ? !hasMatches : !hasExactMatch);

  const hasUnapprovedSelected = selectedTags.some((tag) => tag.approvalStatus === "Unapproved");

  const handleCreateTag = () => {
    const newTagName = searchQuery.trim();
    const newTag: Tag = { tagName: newTagName, approvalStatus: "Unapproved" };
    setCreatedTags((prev) => [newTag, ...prev]);
    setSelectedTags(isSingleSelect ? [newTag] : [...selectedTags, newTag]);
    setSearchQuery("");
  };

  return (
    <div className={`flex flex-col ${variant === "improve" ? "gap-2" : "gap-1"}`}>
      <SearchField
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onCreateTag={handleCreateTag}
        canCreateTag={canCreateTag}
        showLabel={variant === "apply"}
        placeholder={variant === "improve" ? "Search demonstration types..." : "Search"}
      />

      {!hasMatches && searchQuery.trim().length > 0 && (
        <div
          className="flex items-center gap-1 p-1 text-sm text-error-dark"
          data-testid="no-match-message"
          role="alert"
        >
          <ErrorIcon className="shrink-0" width="16" height="16" />
          <span>{NO_MATCH_MESSAGE}</span>
        </div>
      )}

      {hasUnapprovedSelected && (
        <div
          className="flex items-center gap-1 p-1 bg-yellow-50 border border-yellow-300 rounded text-sm"
          data-testid="unapproved-warning-banner"
          role="alert"
        >
          <WarningIcon className="shrink-0" width="16" height="16" />
          <span className="italic text-text-font">{UNAPPROVED_WARNING_MESSAGE}</span>
        </div>
      )}

      {variant === "apply" && (
        <div className="text-md font-semibold">Select tags ({selectedTags.length} selected)</div>
      )}
      <div className={variant === "improve" ? STYLES.tagList : STYLES.applyTagList}>
        {filteredTags.map((tag) => (
          <div
            key={tag.tagName}
            className={`${variant === "improve" ? STYLES.tagLabel : STYLES.applyTagLabel} ${variant === "improve" && selectedTags.some((selected) => selected.tagName === tag.tagName) ? "bg-surface-focus" : ""}`}
          >
            <Checkbox
              name={`checkbox-${tag.tagName}`}
              checked={selectedTags.map((tag) => tag.tagName).includes(tag.tagName)}
              onChange={() => handleToggleTag(tag)}
            />
            <label
              htmlFor={`checkbox-${tag.tagName}`}
              className="text-sm text-text-font flex-1 cursor-pointer"
            >
              {tag.tagName}
              {tag.approvalStatus === "Approved" ? "" : " (Unapproved)"}
            </label>
          </div>
        ))}
        {filteredTags.length === 0 && (
          <p
            className={`text-sm text-text-placeholder italic p-2 ${variant === "improve" ? "text-center" : ""}`}
          >
            {variant === "improve" ? "No matching types found" : "No tags found"}
          </p>
        )}
      </div>
    </div>
  );
};
