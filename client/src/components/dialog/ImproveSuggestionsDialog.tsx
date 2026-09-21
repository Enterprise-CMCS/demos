import React from "react";

import { Button, SecondaryButton } from "components/button";
import { BaseDialog } from "components/dialog/BaseDialog";
import { TagName } from "demos-server";

export const ImproveSuggestionsDialog = ({
  tagName,
  onBack,
  onClose,
}: {
  tagName: TagName;
  onBack: () => void;
  onClose: () => void;
}) => {
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

      <div className="flex items-center justify-between">
        <SecondaryButton name="button-back-to-confirm-tags" onClick={onBack}>
          Back
        </SecondaryButton>
        <Button name="button-confirm-suggestion" disabled>
          Confirm Suggestion
        </Button>
      </div>
    </BaseDialog>
  );
};
