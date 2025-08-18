import React, { useState } from "react";

import { Button } from "components/button/Button";
import { SecondaryButton } from "components/button/SecondaryButton";
import { AutoCompleteSelect } from "components/input/select/AutoCompleteSelect";
import { SelectUSAStates } from "components/input/select/SelectUSAStates";
import { SelectUsers } from "components/input/select/SelectUsers";
import { TextInput } from "components/input/TextInput";
import { BaseModal } from "components/modal/BaseModal";
import { useToast } from "components/toast";
import { useDemonstration } from "hooks/useDemonstration";
import { useExtension } from "hooks/useExtension";
import { normalizeDemonstrationId, normalizeUserId } from "hooks/user/uuidHelpers";

export type ModalMode = "amendment" | "extension" | "demonstration" | "document";

type Props = {
  onClose: () => void;
  mode: ModalMode;
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

export const CreateNewModal: React.FC<Props> = ({ onClose, mode, data }) => {
  const { showSuccess, showError } = useToast();
  const { addExtension } = useExtension();
  const { getAllDemonstrations } = useDemonstration();
  const [title, setTitle] = useState(data?.title || "");
  const [state, setState] = useState(data?.state || "");
  const [projectOfficer, setProjectOfficer] = useState(data?.projectOfficer || "");
  const [effectiveDate, setEffectiveDate] = useState(data?.effectiveDate || "");
  const [expirationDate, setExpirationDate] = useState(data?.expirationDate || "");
  const [description, setDescription] = useState(data?.description || "");
  const [demonstration, setDemonstration] = useState(data?.demonstration || "");
  const [showWarning, setShowWarning] = useState(false);
  const [expirationError, setExpirationError] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch real demonstrations from the database
  React.useEffect(() => {
    getAllDemonstrations.trigger();
  }, [getAllDemonstrations.trigger]);

  // Convert demonstrations to options format for the dropdown
  const demoOptions =
    getAllDemonstrations.data?.map((demo) => ({
      label: demo.name,
      value: demo.id,
    })) || [];

  const capitalized = mode.charAt(0).toUpperCase() + mode.slice(1);
  const showDemoSelect = mode !== "demonstration";

  const isSubmitDisabled =
    (showDemoSelect && !demonstration) || !title || !state || !projectOfficer || isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (showDemoSelect && !demonstration) {
      setShowWarning(true);
      return;
    }
    setShowWarning(false);
    setIsSubmitting(true);

    try {
      if (mode === "extension") {
        // For extensions, we need to create the extension using the addExtension API
        const extensionData = {
          demonstrationId: normalizeDemonstrationId(demonstration),
          name: title,
          description: description,
          extensionStatusId: "EXTENSION_NEW", // Default status for new extensions
          projectOfficerUserId: normalizeUserId(projectOfficer).toString(),
          ...(effectiveDate && { effectiveDate: new Date(effectiveDate) }),
          ...(expirationDate && { expirationDate: new Date(expirationDate) }),
        };
        await addExtension.trigger(extensionData);
      }
      // TODO: Add similar logic for amendments when needed

      showSuccess(`${capitalized} created successfully!`);
      onClose();
    } catch (error) {
      console.error(`Error creating ${mode}:`, error);
      showError(`Failed to create ${mode}. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal
      title={`New ${capitalized}`}
      onClose={onClose}
      showCancelConfirm={showCancelConfirm}
      setShowCancelConfirm={setShowCancelConfirm}
      maxWidthClass="max-w-[720px]"
      actions={
        <>
          <SecondaryButton size="small" onClick={() => setShowCancelConfirm(true)}>
            Cancel
          </SecondaryButton>
          <Button
            name="submit-button"
            onClick={() => {}}
            size="small"
            type="submit"
            form={`create-${mode}-form`}
            disabled={isSubmitDisabled}
          >
            {isSubmitting ? "Creating..." : "Submit"}
          </Button>
        </>
      }
    >
      <form id={`create-${mode}-form`} className="space-y-1" onSubmit={handleSubmit}>
        {showDemoSelect && (
          <div>
            <AutoCompleteSelect
              label="Demonstration"
              placeholder="Select demonstration"
              isRequired
              options={demoOptions}
              onSelect={setDemonstration}
            />
            {showWarning && !demonstration && (
              <p className="text-sm text-text-warn mt-0.5">
                Each {mode} record must be linked to an existing demonstration.
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <TextInput
              name="title"
              label={`${capitalized} Title`}
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
            <label
              className="text-text-font font-bold text-field-label flex gap-0-5"
              htmlFor="effective-date"
            >
              Effective Date
            </label>
            <input
              id="effective-date"
              type="date"
              className="w-full border rounded px-1 py-1 text-sm"
              value={effectiveDate}
              onChange={(e) => {
                setEffectiveDate(e.target.value);
                if (expirationDate && expirationDate < e.target.value) {
                  setExpirationDate("");
                }
              }}
            />
          </div>
          <div className="flex flex-col gap-sm">
            <label
              className={"text-text-font font-bold text-field-label flex gap-0-5"}
              htmlFor="expiration-date"
            >
              Expiration Date
            </label>
            <input
              id="expiration-date"
              type="date"
              className={`w-full border rounded px-1 py-1 text-sm ${expirationError ? "border-border-warn focus:ring-border-warn" : "border-border-fields focus:ring-border-focus"}`}
              value={expirationDate}
              min={effectiveDate || undefined}
              onChange={(e) => {
                const val = e.target.value;
                if (effectiveDate && val < effectiveDate) {
                  setExpirationError("Expiration Date cannot be before Effective Date.");
                } else {
                  setExpirationError("");
                  setExpirationDate(val);
                }
              }}
            />
            {expirationError && (
              <div className="text-text-warn text-sm mt-1">{expirationError}</div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-sm">
          <label
            htmlFor="description"
            className="text-text-font font-bold text-field-label flex gap-0-5"
          >
            {capitalized} Description
          </label>
          <textarea
            id="description"
            placeholder="Enter"
            className="w-full border border-border-fields rounded px-1 py-1 text-sm resize-y min-h-[80px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </form>
    </BaseModal>
  );
};
