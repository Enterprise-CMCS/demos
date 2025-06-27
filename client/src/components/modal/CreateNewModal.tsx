import React, { useState } from "react";

import {
  PrimaryButton,
  SecondaryButton,
} from "components/button";
import { SelectUSAStates } from "components/input/select/SelectUSAStates";
import { SelectUsers } from "components/input/select/SelectUsers";
import { TextInput } from "components/input/TextInput";
import { BaseModal } from "components/modal/BaseModal";
import { useToast } from "components/toast";
import { AddDemonstrationInput } from "demos-server";
import { useDemonstration } from "hooks/useDemonstration";
import { tw } from "tags/tw";

const LABEL_CLASSES = tw`text-text-font font-bold text-field-label flex gap-0-5`;
const DATE_INPUT_CLASSES = tw`w-full border rounded px-1 py-1 text-sm`;

export const CreateNewModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [state, setState] = useState("");
  const [title, setTitle] = useState("");
  const [projectOfficer, setProjectOfficer] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [description, setDescription] = useState("");
  const [expirationError, setExpirationError] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [formStatus, setFormStatus] = useState<"idle" | "pending">("idle");

  const { showSuccess, showError } = useToast();
  const { addDemonstration } = useDemonstration();

  const isFormValid = state && title && projectOfficer;

  const getInput = (): AddDemonstrationInput => ({
    name: title,
    description,
    evaluationPeriodStartDate: new Date(effectiveDate),
    evaluationPeriodEndDate: new Date(expirationDate),
    demonstrationStatusId: "1",
    stateId: state,
    userIds: [projectOfficer],
  });

  const handleSubmit = async () => {
    setFormStatus("pending");
    try {
      const result = await addDemonstration.trigger(getInput());
      if (result.data?.addDemonstration) {
        showSuccess("Demonstration created successfully!");
        onClose();
      } else {
        showError("Failed to create demonstration. Please try again.");
      }
    } catch {
      showError("Failed to create demonstration. Please try again.");
    } finally {
      setFormStatus("idle");
    }
  };

  return (
    <BaseModal
      title="New Demonstration"
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
            disabled={!isFormValid || formStatus === "pending"}
            onClick={() => {
              if (!isFormValid) {
                showError("Please complete all required fields.");
                return;
              }
              handleSubmit();
            }}
          >
            {formStatus === "pending" ? (
              <svg
                className="animate-spin h-2 w-2 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              "Submit"
            )}
          </PrimaryButton>
        </>
      }
    >
      <div className="grid grid-cols-3 gap-5">
        <div>
          <SelectUSAStates label="State/Territory" isRequired onStateChange={setState} />
        </div>
        <div className="col-span-2">
          <TextInput
            name="title"
            label="Demonstration Title"
            isRequired
            placeholder="Placeholder"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-2">
          <SelectUsers label="Project Officer" isRequired onStateChange={setProjectOfficer} />
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
          Demonstration Description
        </label>
        <textarea
          id="description"
          placeholder="Enter"
          className="w-full border border-border-fields rounded px-1 py-1 text-sm resize-y min-h-[80px]"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
    </BaseModal>
  );
};
