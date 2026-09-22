import React, { useState } from "react";

import { Button, SecondaryButton } from "components/button";
import { BaseDialog } from "components/dialog/BaseDialog";
import { TagChip } from "components/tags/TagChip";
import { TagSelector } from "components/tags/TagSelector";
import { useApplicationTagOptions } from "components/tags/useApplicationTagOptions";
import { Tag, TagName } from "demos-server";

export const ImproveSuggestionsDialog = ({
  tagName,
  onBack,
  onClose,
}: {
  tagName: TagName;
  onBack: () => void;
  onClose: () => void;
}) => {
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const { data, loading, error } = useApplicationTagOptions();

  return (
    <BaseDialog
      name="improve-suggestions-dialog"
      title="Improve Suggestions"
      onClose={onClose}
      dialogHasChanges={false}
      maxWidthClass="max-w-[850px]"
    >
      <p className="text-lg text-text-placeholder">
        Search for an alternate tag suggestion for &apos;<strong>{tagName}</strong>&apos;:
      </p>

      {loading ? (
        <p role="status">Loading demonstration types...</p>
      ) : error || !data ? (
        <p role="alert">
          Failed to load demonstration types. Please close the dialog and try again.
        </p>
      ) : (
        <TagSelector
          allTags={[...data.applicationTagOptions].sort((a, b) =>
            a.tagName.localeCompare(b.tagName)
          )}
          selectedTags={selectedTags}
          setSelectedTags={setSelectedTags}
          selectionMode="single"
        />
      )}

      <div className="flex flex-col gap-1">
        <p className="text-md font-semibold">Selected Tag</p>
        <div className="flex flex-wrap gap-1 min-h-8">
          {selectedTags.map((tag) => (
            <TagChip key={tag.tagName} tag={tag} onRemoveTag={() => setSelectedTags([])} />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <SecondaryButton name="button-back-to-confirm-tags" onClick={onBack}>
          Back
        </SecondaryButton>
        <Button name="button-confirm-suggestion" disabled={selectedTags.length === 0}>
          Confirm Suggestion
        </Button>
      </div>
    </BaseDialog>
  );
};
