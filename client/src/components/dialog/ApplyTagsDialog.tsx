import React, { useEffect, useState } from "react";

import { Button } from "components/button";
import { BaseDialog } from "components/dialog/BaseDialog";
import { TagChip } from "components/tags/TagChip";
import { Checkbox } from "components/input";
import { Input } from "components/input/Input";
import { tw } from "tags/tw";

export const TEMP_SELECTED_TAGS = ["Basic Health Plan (BHP)", "Behavioral Health", "Dental"];

export const APPLY_TAGS_DIALOG_TITLE = "APPLY TAGS";
const STYLES = {
  tagLabel: tw`flex items-center gap-1 p-1 cursor-pointer hover:bg-gray-50 rounded border-b border-border-rules`,
  tagList: tw`flex flex-col border border-border-rules max-h-64 overflow-y-auto`,
};

const tagSetsDiffer = (a: string[], b: string[]): boolean => {
  return a.length !== b.length || a.some((item) => !b.includes(item));
};

const SearchField = ({
  searchQuery,
  setSearchQuery,
}: {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}) => {
  return (
    <Input
      name="input-apply-tags-search"
      type="text"
      label="Demonstration Type"
      placeholder="Search"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      isRequired={true}
    />
  );
};

const TagSelector = ({
  allTags,
  selectedTags,
  setSelectedTags,
}: {
  allTags: string[];
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const filteredTags = allTags.filter((tag) =>
    tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-1">
      <SearchField searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <div className="text-md font-semibold">Select tags ({selectedTags.length} selected)</div>
      <div className={STYLES.tagList}>
        {filteredTags.map((tag) => (
          <label key={tag} className={STYLES.tagLabel}>
            <Checkbox
              name={`checkbox-${tag}`}
              checked={selectedTags.includes(tag)}
              onChange={() => handleToggleTag(tag)}
            />
            <span className="text-sm text-text-font">{tag}</span>
          </label>
        ))}
        {filteredTags.length === 0 && (
          <p className="text-sm text-text-placeholder italic p-2">No tags found</p>
        )}
      </div>
    </div>
  );
};

export interface ApplyTagsDialogProps {
  onClose: () => void;
  initiallySelectedTags: string[];
  allTags: string[];
}

export const ApplyTagsDialog: React.FC<ApplyTagsDialogProps> = ({
  onClose,
  initiallySelectedTags,
  allTags,
}) => {
  const [selectedTags, setSelectedTags] = useState<string[]>([...initiallySelectedTags]);
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  useEffect(() => {
    setHasChanges(tagSetsDiffer(selectedTags, initiallySelectedTags));
  }, [selectedTags]);

  const handleApply = () => {
    onClose();
  };

  return (
    <BaseDialog
      name="apply-tags-dialog"
      title={APPLY_TAGS_DIALOG_TITLE}
      onClose={onClose}
      dialogHasChanges={hasChanges}
      actionButton={
        <Button onClick={handleApply} name="button-confirm-apply-tags">
          Add Tag(s)
        </Button>
      }
    >
      <div className="flex flex-col gap-1">
        <TagSelector
          allTags={allTags}
          selectedTags={selectedTags}
          setSelectedTags={setSelectedTags}
        />
        <div className="flex flex-col gap-1">
          <label className="block text-md font-semibold text-text-font">
            Selected Tag(s) ({selectedTags.length})
          </label>
          <div className="flex flex-wrap gap-1 min-h-8">
            {selectedTags.map((tag) => (
              <TagChip
                key={tag}
                tag={tag}
                onRemoveTag={() => setSelectedTags(selectedTags.filter((t) => t !== tag))}
              />
            ))}
            {selectedTags.length === 0 && (
              <p className="text-sm text-text-placeholder italic">No tags selected</p>
            )}
          </div>
        </div>
      </div>
    </BaseDialog>
  );
};
