import React, { useEffect, useState } from "react";

import { Button } from "components/button";
import { BaseDialog } from "components/dialog/BaseDialog";
import { TagChip } from "components/tags/TagChip";
import { Checkbox } from "components/input";
import { Input } from "components/input/Input";

export const TEMP_SELECTED_TAGS = ["Basic Health Plan (BHP)", "Behavioral Health", "Dental"];

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
      <div className="flex flex-col border border-gray-300 max-h-64 overflow-y-auto">
        {filteredTags.map((tag) => (
          <label
            key={tag}
            className="flex items-center gap-1 p-1 cursor-pointer hover:bg-gray-50 rounded border-b border-gray-200"
          >
            <Checkbox
              name={`checkbox-${tag}`}
              checked={selectedTags.includes(tag)}
              onChange={() => handleToggleTag(tag)}
            />
            <span className="text-sm text-black">{tag}</span>
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
      title="Apply Tags"
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
        <div>
          <label className="block text-sm font-medium text-black mb-2">Selected Tag(s)</label>
          <div className="flex flex-wrap gap-1 min-h-8">
            {selectedTags.map((tag) => (
              <TagChip key={tag} tag={tag} onRemoveTag={() => {}} />
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
