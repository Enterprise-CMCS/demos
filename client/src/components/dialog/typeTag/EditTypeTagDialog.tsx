import React from "react";

import { TagName } from "demos-server";

import { Button } from "components/button";
import { BaseDialog } from "components/dialog/BaseDialog";
import { TextInput } from "components/input";

export const EDIT_TYPE_TAG_DIALOG_TITLE = "Edit Type/Tag";
export const EDIT_TYPE_TAG_DIALOG_NAME = "edit-type-tag-dialog";
export const TYPE_TAG_DISPLAY_TEXT_INPUT_NAME = "input-type-tag-display-text";
export const SAVE_TYPE_TAG_BUTTON_NAME = "button-save-type-tag";
export const DUPLICATE_TYPE_TAG_MESSAGE = "A Type/Tag with this description already exists.";

// Case and surrounding whitespace don't make a Type/Tag distinct, so "chip " duplicates "CHIP".
const normalizeTypeTagName = (typeTagName: string): string => typeTagName.trim().toLowerCase();

// The Type/Tag being edited is skipped so an admin can correct the casing of its own name.
const isDuplicateTypeTagName = (
  displayText: string,
  typeTagName: TagName,
  existingTypeTagNames: TagName[]
): boolean =>
  existingTypeTagNames.some(
    (existingName) =>
      existingName !== typeTagName &&
      normalizeTypeTagName(existingName) === normalizeTypeTagName(displayText)
  );

export const EditTypeTagDialog = ({
  typeTagName,
  existingTypeTagNames,
  onClose,
}: {
  typeTagName: TagName;
  existingTypeTagNames: TagName[];
  onClose: () => void;
}) => {
  const [displayText, setDisplayText] = React.useState<string>(typeTagName);

  const trimmedDisplayText = displayText.trim();
  const hasChanges = trimmedDisplayText !== typeTagName;
  const isDuplicate = isDuplicateTypeTagName(displayText, typeTagName, existingTypeTagNames);
  const canSave = trimmedDisplayText !== "" && hasChanges && !isDuplicate;

  // TODO DEMOS-2512: persist the new display text and refetch the Type/Tag tables.
  const handleSave = () => onClose();

  return (
    <BaseDialog
      name={EDIT_TYPE_TAG_DIALOG_NAME}
      title={EDIT_TYPE_TAG_DIALOG_TITLE}
      onClose={onClose}
      dialogHasChanges={hasChanges}
      actionButton={
        <Button name={SAVE_TYPE_TAG_BUTTON_NAME} disabled={!canSave} onClick={handleSave}>
          Save Changes
        </Button>
      }
    >
      <TextInput
        name={TYPE_TAG_DISPLAY_TEXT_INPUT_NAME}
        label="Display Text"
        isRequired
        value={displayText}
        onChange={(event) => setDisplayText(event.target.value)}
        getValidationMessage={() => (isDuplicate ? DUPLICATE_TYPE_TAG_MESSAGE : "")}
      />
    </BaseDialog>
  );
};
