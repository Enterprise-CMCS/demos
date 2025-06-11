import React, { useState } from "react";

import { ErrorOutlinedButton } from "components/button/ErrorOutlinedButton";
import { PrimaryButton } from "components/button/PrimaryButton";
import { SecondaryButton } from "components/button/SecondaryButton";
import { SelectUSAStates } from "components/input/select/SelectUSAStates";
import { SelectUsers } from "components/input/select/SelectUsers";
import { TextInput } from "components/input/TextInput";
import { tw } from "tags/tw";

const LABEL_CLASSES = tw`text-text-font font-bold text-field-label flex gap-0-5`;

interface Props {
  onClose: () => void;
}

export const CreateNewModal: React.FC<Props> = ({ onClose }) => {
  const [state, setState] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [projectOfficer, setProjectOfficer] = useState<string>("");
  const [effectiveDate, setEffectiveDate] = useState<string>("");
  const [expirationDate, setExpirationDate] = useState<string>("");
  const [expirationError, setExpirationError] = useState<string>("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [formStatus, setFormStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const isFormValid =
    state &&
    title &&
    projectOfficer &&
    effectiveDate &&
    expirationDate &&
    expirationDate >= effectiveDate;

  const handleSubmit = () => {
    setFormStatus("loading");

    // simulate API call
    setTimeout(() => {
      // Randomly succeed or fail for now
      const isSuccess = Math.random() > 0.2;

      if (isSuccess) {
        setFormStatus("success");
      } else {
        setFormStatus("error");
      }
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div
        className="bg-[var(--color-surface-white)] border border-[var(--color-border-rules)] rounded shadow-lg w-[880px] max-w-[95vw]"
        style={{ color: "var(--color-text-font)" }}
      >
        <div className="flex justify-between items-center px-4 py-1 pt-2 border-b border-[var(--color-border-rules)]">
          <h2 className="text-[22px] font-bold">New Demonstration</h2>
          <button
            onClick={() => setShowCancelConfirm(true)}
            className="text-[22px] text-[var(--color-text-placeholder)] hover:text-[var(--color-text-font)]"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <form className="px-3 py-1 space-y-1 text-[14px]">
          <div className="grid grid-cols-3 gap-5">
            <div>
              <SelectUSAStates
                label="State/Territory"
                isRequired={true}
                isDisabled={false}
                onStateChange={setState}
              />
            </div>
            <div className="col-span-2">
              <TextInput
                name="title"
                label="Demonstration Title"
                isDisabled={false}
                isRequired={true}
                placeholder="Placeholder"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-2">
              <SelectUsers
                label="Project Officer"
                isRequired={true}
                isDisabled={false}
                onStateChange={setProjectOfficer}
              />
            </div>
            <div className="flex flex-col gap-sm">
              <label className={LABEL_CLASSES}>Effective Date</label>
              <input
                type="date"
                className="w-full border border-[var(--color-border-fields)] rounded px-1 py-1 text-sm"
                value={effectiveDate}
                onChange={(e) => {
                  setEffectiveDate(e.target.value);
                  if (expirationDate && e.target.value && expirationDate < e.target.value) {
                    setExpirationDate("");
                  }
                }}
              />
            </div>
            <div className="flex flex-col gap-sm">
              <label className={LABEL_CLASSES}>Expiration Date</label>
              <input
                type="date"
                className={`w-full border rounded px-1 py-1 text-sm
                  ${expirationError
                    ? "border-[var(--color-border-warn)] focus:ring-[var(--color-border-warn)]"
                    : "border-[var(--color-border-fields)] focus:ring-[var(--color-border-focus)]"}
                `}
                value={expirationDate}
                min={effectiveDate || undefined}
                onChange={(e) => {
                  const newExpirationDate = e.target.value;

                  if (effectiveDate && newExpirationDate < effectiveDate) {
                    setExpirationError("Expiration Date cannot be before Effective Date.");
                  } else {
                    setExpirationError("");
                    setExpirationDate(newExpirationDate);
                  }
                }}
              />
              {expirationError && (
                <div className="text-[var(--color-text-warn)] text-sm mt-1">{expirationError}</div>
              )}
            </div>

          </div>

          <div className="flex flex-col gap-sm">
            <label className={LABEL_CLASSES}>Demonstration Description</label>
            <textarea
              placeholder="Enter"
              className="w-full border border-[var(--color-border-fields)] rounded px-1 py-1 text-sm resize-y min-h-[80px]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <SecondaryButton size="small" onClick={() => setShowCancelConfirm(true)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton
              size="small"
              disabled={!isFormValid || formStatus === "loading"}
              onClick={handleSubmit}
            >
              {formStatus === "loading" ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-2 w-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Submitting...
                </div>
              ) : "Submit"}
            </PrimaryButton>
          </div>
          {formStatus === "success" && (
            <div className="text-[var(--color-text-success)] text-sm pt-2">
              Demonstration created successfully. (Placeholder Message)
            </div>
          )}
          {formStatus === "error" && (
            <div className="text-[var(--color-text-warn)] text-sm pt-2">
              Failed to create demonstration. (Placeholder Message)
            </div>
          )}
        </form>
      </div>
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-[var(--color-surface-white)] border border-[var(--color-border-rules)] rounded p-2 w-[400px]">
            <p className="text-lg font-bold mb-2 text-[var(--color-text-font)]">Are you sure you want to cancel?</p>
            <div className="flex justify-end gap-2">
              <SecondaryButton size="small" onClick={() => setShowCancelConfirm(false)}>
                No
              </SecondaryButton>
              <ErrorOutlinedButton size="small" onClick={onClose}>
                Yes
              </ErrorOutlinedButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
