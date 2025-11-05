import React, { useEffect, useState } from "react";

import { Button, SecondaryButton } from "components/button";
import { BaseContextDialog } from "components/dialog/BaseContextDialog";
import { AutoCompleteSelect } from "components/input/select/AutoCompleteSelect";
import { SelectUSAStates } from "components/input/select/SelectUSAStates";
import { SelectUsers } from "components/input/select/SelectUsers";
import { TextInput } from "components/input/TextInput";
import { useDateValidation } from "hooks/useDateValidation";
import { useDemonstration } from "hooks/useDemonstration";
import { useDemonstrationOptions } from "hooks/useDemonstrationOptions";
import { createSuccessMessages, useDialogForm } from "hooks/useDialogForm";
import { normalizeDemonstrationId, normalizeUserId } from "hooks/user/uuidHelpers";
import { tw } from "tags/tw";

const LABEL_CLASSES = tw`text-text-font font-bold text-field-label flex gap-0-5`;
const DATE_INPUT_CLASSES = tw`w-full border rounded px-1 py-1 text-sm`;

export type ModificationDialogMode = "add" | "edit";

export type ModificationDialogData = {
  title?: string;
  state?: string;
  projectOfficer?: string;
  effectiveDate?: string;
  expirationDate?: string;
  description?: string;
  demonstration?: string;
};

export interface BaseModificationDialogProps {
  onClose: () => void;
  mode: ModificationDialogMode;
  entityId?: string;
  demonstrationId?: string;
  data?: ModificationDialogData;
  entityType: "amendment" | "extension";
  onSubmit: (formData: Record<string, unknown>) => Promise<void>;
  getFormData: (
    baseData: Record<string, unknown>,
    effectiveDate?: string,
    expirationDate?: string
  ) => Record<string, unknown>;
}

export const BaseModificationDialog: React.FC<BaseModificationDialogProps> = ({
  onClose,
  mode,
  demonstrationId,
  data,
  entityType,
  onSubmit,
  getFormData,
}) => {
  const [state, setState] = useState(data?.state || "");
  const [title, setTitle] = useState(data?.title || "");
  const [projectOfficer, setProjectOfficer] = useState(data?.projectOfficer || "");
  const [effectiveDate, setEffectiveDate] = useState(data?.effectiveDate || "");
  const [expirationDate, setExpirationDate] = useState(data?.expirationDate || "");
  const [description, setDescription] = useState(data?.description || "");
  const [demonstration, setDemonstration] = useState(data?.demonstration || demonstrationId || "");

  const { demoOptions } = useDemonstrationOptions();
  const { demonstration: demonstrationDetails, projectOfficer: demonstrationProjectOfficer } =
    useDemonstration(demonstrationId);

  useEffect(() => {
    if (demonstrationId && demonstrationDetails && !data?.state) {
      setState(demonstrationDetails.state.id);
    }
    if (demonstrationId && demonstrationProjectOfficer && !data?.projectOfficer) {
      setProjectOfficer(demonstrationProjectOfficer.person.id);
    }
  }, [
    demonstrationId,
    demonstrationDetails,
    demonstrationProjectOfficer,
    data?.state,
    data?.projectOfficer,
  ]);

  const shouldShowProjectOfficer = !demonstrationId;
  const isStateDisabled = Boolean(demonstrationId);

  const { expirationError, handleEffectiveDateChange, handleExpirationDateChange } =
    useDateValidation();

  const capitalizedEntityType = entityType.charAt(0).toUpperCase() + entityType.slice(1);

  const { formStatus, showWarning, showCancelConfirm, setShowCancelConfirm, handleSubmit } =
    useDialogForm({
      mode,
      onClose,
      validateForm: () => {
        const basicValidation = Boolean(demonstration && title && state);
        const projectOfficerValidation = shouldShowProjectOfficer ? Boolean(projectOfficer) : true;
        return basicValidation && projectOfficerValidation;
      },
      getFormData: () => {
        const baseFormData: Record<string, unknown> = {
          demonstrationId: normalizeDemonstrationId(demonstration),
          name: title,
          description: description,
        };

        if (shouldShowProjectOfficer && projectOfficer) {
          baseFormData.projectOfficerUserId = normalizeUserId(projectOfficer).toString();
        }

        return getFormData(baseFormData, effectiveDate, expirationDate);
      },
      onSubmit,
      successMessage: createSuccessMessages(
        `${capitalizedEntityType} created successfully!`,
        `${capitalizedEntityType} updated successfully!`
      ),
      errorMessage: `Failed to save ${entityType}. Please try again.`,
    });

  return (
    <BaseContextDialog
      title={mode === "edit" ? `Edit ${capitalizedEntityType}` : `New ${capitalizedEntityType}`}
      onClose={onClose}
      showCancelConfirm={showCancelConfirm}
      setShowCancelConfirm={setShowCancelConfirm}
      maxWidthClass="max-w-[720px]"
      actions={
        <>
          <SecondaryButton
            name="button-cancel-modification-dialog"
            size="small"
            onClick={() => setShowCancelConfirm(true)}
          >
            Cancel
          </SecondaryButton>
          <Button
            name="button-submit-modification-dialog"
            size="small"
            type="submit"
            form={`${entityType}-form`}
            onClick={() => {}}
            disabled={
              !(
                demonstration &&
                title &&
                state &&
                (shouldShowProjectOfficer ? projectOfficer : true)
              ) || formStatus === "pending"
            }
          >
            {formStatus === "pending" ? "Saving..." : "Submit"}
          </Button>
        </>
      }
    >
      <form id={`${entityType}-form`} className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <AutoCompleteSelect
            label="Demonstration"
            placeholder="Select demonstration"
            isRequired
            isDisabled={Boolean(demonstrationId)}
            options={demoOptions}
            value={demonstration}
            onSelect={setDemonstration}
          />
          {showWarning && !demonstration && (
            <p className="text-sm text-text-warn mt-0.5">
              Each {entityType} record must be linked to an existing demonstration.
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <TextInput
              name="title"
              label={`${capitalizedEntityType} Title`}
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
              isDisabled={isStateDisabled}
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {shouldShowProjectOfficer && (
            <div className="col-span-2">
              <SelectUsers
                label="Project Officer"
                isRequired
                initialUserId={projectOfficer}
                onSelect={setProjectOfficer}
                personTypes={["demos-admin", "demos-cms-user"]}
              />
            </div>
          )}
          {mode === "edit" && (
            <>
              <div className="flex flex-col gap-sm">
                <label className={LABEL_CLASSES} htmlFor="effective-date">
                  Effective Date
                </label>
                <input
                  id="effective-date"
                  type="date"
                  className={DATE_INPUT_CLASSES}
                  data-testid="input-effective-date"
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
            </>
          )}
        </div>

        <div className="flex flex-col gap-sm">
          <label className={LABEL_CLASSES} htmlFor="description">
            {capitalizedEntityType} Description
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
    </BaseContextDialog>
  );
};
