import React, { useState } from "react";

import { PrimaryButton } from "components/button/PrimaryButton";
import { SecondaryButton } from "components/button/SecondaryButton";
import { AutoCompleteSelect } from "components/input/select/AutoCompleteSelect";
import { SelectUSAStates } from "components/input/select/SelectUSAStates";
import { SelectUsers } from "components/input/select/SelectUsers";
import { TextInput } from "components/input/TextInput";
import { BaseModal } from "components/modal/BaseModal";
import { useToast } from "components/toast";

const DEMO_OPTIONS = [
  { label: "Medicaid Reform - Florida", value: "medicaid-fl" },
  { label: "Innovative Care - California", value: "innovative-ca" },
];

export type ModalMode = "amendment" | "extension" | "demonstration";

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
  const { showSuccess } = useToast();
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

  const capitalized = mode.charAt(0).toUpperCase() + mode.slice(1);
  const showDemoSelect = mode !== "demonstration";

  const isSubmitDisabled =
    (showDemoSelect && !demonstration) ||
    !title ||
    !state ||
    !projectOfficer;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (showDemoSelect && !demonstration) {
      setShowWarning(true);
      return;
    }
    setShowWarning(false);
    showSuccess(`${capitalized} created successfully!`);
    onClose();
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
          <PrimaryButton
            size="small"
            type="submit"
            form={`create-${mode}-form`}
            disabled={isSubmitDisabled}
          >
            Submit
          </PrimaryButton>
        </>
      }
    >
      <form
        id={`create-${mode}-form`}
        className="space-y-1"
        onSubmit={handleSubmit}
      >
        {showDemoSelect && (
          <div>
            <AutoCompleteSelect
              label="Demonstration"
              placeholder="Select demonstration"
              isRequired
              options={DEMO_OPTIONS}
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
            <label className="text-text-font font-bold text-field-label flex gap-0-5" htmlFor="effective-date">
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
            <label className={"text-text-font font-bold text-field-label flex gap-0-5"} htmlFor="expiration-date">
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
          <label htmlFor="description" className="text-text-font font-bold text-field-label flex gap-0-5">
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
