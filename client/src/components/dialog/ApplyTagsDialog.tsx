import React, { useEffect, useState } from "react";

import { Button } from "components/button";
import { BaseDialog } from "components/dialog/BaseDialog";
import { TagChip } from "components/tags/TagChip";

export interface ApplyTagsDialogProps {
  onClose: () => void;
  initialTags: string[];
}

const tagsDiffer = (a: string[], b: string[]): boolean => {
  return a.length !== b.length || a.some((item) => !b.includes(item));
};

export const ApplyTagsDialog: React.FC<ApplyTagsDialogProps> = ({ onClose, initialTags }) => {
  const [activeTags] = useState<string[]>([...initialTags]);
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  useEffect(() => {
    setHasChanges(tagsDiffer(activeTags, initialTags));
  }, [activeTags]);

  const handleApply = () => {
    onClose();
  };

  return (
    <BaseDialog
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
        <div className="flex flex-wrap gap-1">
          {activeTags.map((tag) => (
            <TagChip key={tag} tag={tag} onRemoveTag={() => {}} />
          ))}
        </div>
        {activeTags.length === 0 && (
          <p className="text-sm text-text-placeholder italic">No tags selected</p>
        )}
      </div>
    </BaseDialog>
  );
};
