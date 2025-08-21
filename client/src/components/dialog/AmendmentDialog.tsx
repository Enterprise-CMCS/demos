import React, { useState } from "react";

import {
  Button,
  SecondaryButton,
} from "components/button";
import { BaseDialog } from "components/dialog/BaseDialog";
import { AutoCompleteSelect } from "components/input/select/AutoCompleteSelect";
import { SelectUSAStates } from "components/input/select/SelectUSAStates";
import { SelectUsers } from "components/input/select/SelectUsers";
import { TextInput } from "components/input/TextInput";
import { useDateValidation } from "hooks/useDateValidation";
import { useDemonstrationOptions } from "hooks/useDemonstrationOptions";
import { useDialogForm } from "hooks/useDialogForm";
import {
  createFormDataWithDates,
  createSuccessMessages,
} from "hooks/useDialogHelpers";
import {
  normalizeDemonstrationId,
  normalizeUserId,
} from "hooks/user/uuidHelpers";
import { tw } from "tags/tw";

const LABEL_CLASSES = tw`text-text-font font-bold text-field-label flex gap-0-5`;
const DATE_INPUT_CLASSES = tw`w-full border rounded px-1 py-1 text-sm`;

type AmendmentDialogMode = "add" | "edit";

type Props = {
  isOpen?: boolean;
  onClose: () => void;
  mode: AmendmentDialogMode;
  amendmentId?: string;
  demonstrationId?: string;
  data?: {
    title?: string;
    state?: string;
    projectOfficer?: string;
    effectiveDate?: string;
    expirationDate?: string;
    description?: string;
    demonstration?: string;
  };
};

export const AmendmentDialog: React.FC<Props> = ({
  isOpen = true,
  onClose,
  mode,
  demonstrationId,
  data,
}) => {
  const [state, setState] = useState(data?.state || "");
  const [title, setTitle] = useState(data?.title || "");
  const [projectOfficer, setProjectOfficer] = useState(data?.projectOfficer || "");
  const [effectiveDate, setEffectiveDate] = useState(data?.effectiveDate || "");
  const [expirationDate, setExpirationDate] = useState(data?.expirationDate || "");
  const [description, setDescription] = useState(data?.description || "");
  const [demonstration, setDemonstration] = useState(data?.demonstration || demonstrationId || "");

  const { demoOptions } = useDemonstrationOptions();

  const { expirationError, handleEffectiveDateChange, handleExpirationDateChange } =
    useDateValidation();

  const { formStatus, showWarning, showCancelConfirm, setShowCancelConfirm, handleSubmit } =
    useDialogForm({
      mode,
      onClose,
      validateForm: () => Boolean(demonstration && title && state && projectOfficer),
      getFormData: () =>
        createFormDataWithDates(
          {
            demonstrationId: normalizeDemonstrationId(demonstration),
            name: title,
            description: description,
            projectOfficerUserId: normalizeUserId(projectOfficer).toString(),
          },
          effectiveDate,
          expirationDate
        ),
      onSubmit: async (amendmentData) => {
        // TODO: Implement amendment creation/update logic when amendment hooks are available
        console.log("Amendment data to be created:", amendmentData);
      },
      successMessage: createSuccessMessages(
        "Amendment created successfully!",
        "Amendment updated successfully!"
      ),
      errorMessage: "Failed to save amendment. Please try again.",
    });

  return (
    <BaseDialog
      title={mode === "edit" ? "Edit Amendment" : "New Amendment"}
      isOpen={isOpen}
      onClose={onClose}
      showCancelConfirm={showCancelConfirm}
      setShowCancelConfirm={setShowCancelConfirm}
      maxWidthClass="max-w-[720px]"
      actions={
        <>
          <SecondaryButton name="cancel" size="small" onClick={() => setShowCancelConfirm(true)}>
            Cancel
          </SecondaryButton>
          <Button
            name="submit"
            size="small"
            type="submit"
            form="amendment-form"
            onClick={() => {}}
            disabled={
              !(demonstration && title && state && projectOfficer) || formStatus === "pending"
            }
          >
            {formStatus === "pending" ? "Saving..." : "Submit"}
          </Button>
        </>
      }
    >
      <form id="amendment-form" className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <AutoCompleteSelect
            label="Demonstration"
            placeholder="Select demonstration"
            isRequired
            options={demoOptions}
            value={demonstration}
            onSelect={setDemonstration}
          />
          {showWarning && !demonstration && (
            <p className="text-sm text-text-warn mt-0.5">
              Each amendment record must be linked to an existing demonstration.
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <TextInput
              name="title"
              label="Amendment Title"
              placeholder="Enter title"
              isRequired
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <SelectUSAStates
              label="State/Territory"
              isRequired
              currentState={state}
              onStateChange={setState}
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <div className="col-span-2">
            <SelectUsers
              label="Project Officer"
              isRequired
              currentUserId={projectOfficer}
              onStateChange={setProjectOfficer}
            />
          </div>
          <div className="flex flex-col gap-sm">
            <label className={LABEL_CLASSES} htmlFor="effective-date">
              Effective Date
            </label>
            <input
              id="effective-date"
              type="date"
              className={DATE_INPUT_CLASSES}
              data-testid="effective-date-input"
              value={effectiveDate}
              onChange={(e) => {
                handleEffectiveDateChange(
                  e.target.value,
                  expirationDate,
                  setEffectiveDate,
                  setExpirationDate
                );
              }}
            />
          </div>
          <div className="flex flex-col gap-sm">
            <label className={LABEL_CLASSES} htmlFor="expiration-date">
              Expiration Date
            </label>
            <input
              id="expiration-date"
              type="date"
              className={`${DATE_INPUT_CLASSES} ${
                expirationError
                  ? "border-border-warn focus:ring-border-warn"
                  : "border-border-fields focus:ring-border-focus"
              }`}
              data-testid="input-expiration-date"
              value={expirationDate}
              min={effectiveDate || undefined}
              onChange={(e) => {
                handleExpirationDateChange(e.target.value, effectiveDate, setExpirationDate);
              }}
            />
            {expirationError && (
              <div className="text-text-warn text-sm mt-1">{expirationError}</div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-sm">
          <label className={LABEL_CLASSES} htmlFor="description">
            Amendment Description
          </label>
          <textarea
            id="description"
            placeholder="Enter description"
            className="w-full border border-border-fields rounded px-1 py-1 text-sm resize-y min-h-[80px]"
            data-testid="textarea-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </form>
    </BaseDialog>
  );
};
