import React, { useEffect, useState } from "react";

import { Button } from "components/button";
import { BaseDialog } from "components/dialog/BaseDialog";
import { TagChip } from "components/tags/TagChip";
import { Checkbox } from "components/input";

export const TEMP_ALL_TAGS = [
  "Basic Health Plan (BHP)",
  "Behavioral Health",
  "Dental",
  "Health Homes",
  "Managed Care",
  "Medicaid Expansion",
  "Population Health",
  "Public Health Emergency (PHE) Response",
  "Social Determinants of Health (SDOH)",
  "Telehealth",
];

export const TEMP_SELECTED_TAGS = ["Basic Health Plan (BHP)", "Behavioral Health", "Dental"];

const tagSetsDiffer = (a: string[], b: string[]): boolean => {
  return a.length !== b.length || a.some((item) => !b.includes(item));
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
  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-black mb-2">Select Tags</label>
      <div className="flex flex-col border border-gray-300">
        {allTags.map((tag) => (
          <label
            key={tag}
            className="flex items-center gap-1 p-1 cursor-pointer hover:bg-gray-50 rounded"
          >
            <Checkbox
              name={`checkbox-${tag}`}
              checked={selectedTags.includes(tag)}
              onChange={() => handleToggleTag(tag)}
            />
            <span className="text-sm text-black">{tag}</span>
          </label>
        ))}
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
      <div className="space-y-4">
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
