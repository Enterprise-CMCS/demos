import React, { useState } from "react";

import { PrimaryButton } from "../button/PrimaryButton";
import { SecondaryButton } from "../button/SecondaryButton";
import {
  AutoCompleteSelect,
  Option,
} from "../input/select/AutoCompleteSelect";
import { SelectUSAStates } from "../input/select/SelectUSAStates";
import { SelectUsers } from "../input/select/SelectUsers";
import { BaseModal } from "../modal/BaseModal";
import { TextInput } from "../input/TextInput";
import { tw } from "tags/tw";
import { useToast } from "components/toast";

const LABEL_CLASSES = tw`text-text-font font-bold text-field-label flex gap-0-5`;
const DATE_INPUT_CLASSES = tw`w-full border rounded px-1 py-1 text-sm`;

type Props = {
  onClose: () => void;
};

export const CreateNewAmendmentModal: React.FC<Props> = ({ onClose }) => {
  const [demonstration, setDemonstration] = useState("");
  const [state, setState] = useState("");
  const [title, setTitle] = useState("");
  const [projectOfficer, setProjectOfficer] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [expirationError, setExpirationError] = useState("");
  const [description, setDescription] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const { showSuccess } = useToast();

  const isSubmitDisabled = !demonstration || !state || !title || !projectOfficer;

  const demoOptions: Option[] = [
    { label: "Medicaid Reform - Florida", value: "medicaid-fl" },
    { label: "Innovative Care - California", value: "innovative-ca" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      demonstration,
      state,
      title,
      projectOfficer,
      effectiveDate,
      expirationDate,
      description,
    };

    console.log("Submitting amendment payload:", payload);

    showSuccess("Amendment created successfully!");
    onClose();
  };

  return (
    <BaseModal
      title="New Amendment"
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
            type="submit"
            form="create-amendment-form"
            size="small"
            disabled={isSubmitDisabled}
          >
            Submit
          </PrimaryButton>
        </>
      }
    >
      <form id="create-amendment-form" onSubmit={handleSubmit} className="space-y-1">
        <div>
          <AutoCompleteSelect
            label="Demonstration"
            options={demoOptions}
            onSelect={(val) => setDemonstration(val)}
            isRequired
            placeholder="Select demonstration"
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <TextInput
              name="title"
              label="Title"
              isRequired
              placeholder="Placeholder"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <SelectUSAStates
              label="State/Territory"
              currentState={state}
              onStateChange={setState}
              isRequired
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
            <label className={LABEL_CLASSES} htmlFor="expiration-date">
              Expiration Date
            </label>
            <input
              id="expiration-date"
              type="date"
              className={`${DATE_INPUT_CLASSES} ${expirationError
                ? "border-border-warn focus:ring-border-warn"
                : "border-border-fields focus:ring-border-focus"
              }`}
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
          <label className={LABEL_CLASSES} htmlFor="description">
            Amendment Description
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
