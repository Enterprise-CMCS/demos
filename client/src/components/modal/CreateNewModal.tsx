import React, { useState } from "react";

import { ErrorOutlinedButton } from "components/button/ErrorOutlinedButton";
import { PrimaryButton } from "components/button/PrimaryButton";
import { SecondaryButton } from "components/button/SecondaryButton";
import { SelectUSAStates } from "components/input/select/SelectUSAStates";
import { SelectUsers } from "components/input/select/SelectUsers";
import { TextInput } from "components/input/TextInput";
import { Modal } from "components/modal/Modal";
import { useToast } from "components/toast/ToastContext";
import { tw } from "tags/tw";

const HEADER_CLASSES = tw`flex justify-between items-center px-4 py-1 pt-2 border-b border-border-rules`;
const LABEL_CLASSES = tw`text-text-font font-bold text-field-label flex gap-0-5`;
const DATE_INPUT_CLASSES = tw`w-full border rounded px-1 py-1 text-sm`;
const CONFIRMATION_MODAL_CLASSES = tw`fixed inset-0 z-50 flex items-center justify-center bg-black/40`;
const CONFIRMATION_CONTENT_CLASSES = tw`bg-surface-white border border-border-rules rounded p-2 w-[400px]`;

type Props = {
  onClose: () => void;
};

export const CreateNewModal: React.FC<Props> = ({
  onClose,
}) => {
  const [state, setState] = useState("");
  const [title, setTitle] = useState("");
  const [projectOfficer, setProjectOfficer] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [description, setDescription] = useState("");
  const [expirationError, setExpirationError] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [formStatus, setFormStatus] = useState<"idle" | "loading">("idle");

  const isFormValid = state && title && projectOfficer;
  const { showSuccess, showError } = useToast();

  const handleSubmit = async () => {
    setFormStatus("loading");

    setTimeout(() => {
      const isSuccess = Math.random() > 0.2;

      if (isSuccess) {
        showSuccess("Demonstration created successfully.");
      } else {
        showError("Failed to create demonstration.");
      }

      setFormStatus("idle"); // always reset back to idle after toast
    }, 2000);
  };

  return (
    <>
      <Modal onClose={() => setShowCancelConfirm(true)}>
        <div className={HEADER_CLASSES}>
          <h2 className="text-[22px] font-bold">New Demonstration</h2>
          <button
            onClick={() => setShowCancelConfirm(true)}
            className="text-[22px] text-text-placeholder hover:text-text-font"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <form
          data-testid="create-form"
          className="px-3 py-1 space-y-1 text-[14px]"
          onSubmit={handleSubmit}
        >
          <div className="grid grid-cols-3 gap-5">
            <div>
              <SelectUSAStates
                label="State/Territory"
                isRequired
                onStateChange={setState}
              />
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
              <SelectUsers
                label="Project Officer"
                isRequired
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
                  const newExpirationDate = e.target.value;
                  if (effectiveDate && newExpirationDate < effectiveDate) {
                    setExpirationError(
                      "Expiration Date cannot be before Effective Date."
                    );
                  } else {
                    setExpirationError("");
                    setExpirationDate(newExpirationDate);
                  }
                }}
              />
              {expirationError && (
                <div className="text-text-warn text-sm mt-1">
                  {expirationError}
                </div>
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

          <div className="flex justify-end gap-2 pt-1">
            <SecondaryButton
              type="button"
              size="small"
              onClick={() => setShowCancelConfirm(true)}
            >
              Cancel
            </SecondaryButton>
            <PrimaryButton
              size="small"
              disabled={!isFormValid || formStatus === "loading"}
              onClick={() => {
                if (!isFormValid) {
                  showError("Please complete all required fields.");
                  return;
                }
                handleSubmit();
              }}
            >
              {formStatus === "loading" ? (
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
          </div>
        </form>
      </Modal>

      {showCancelConfirm && (
        <div className={CONFIRMATION_MODAL_CLASSES}>
          <div className={CONFIRMATION_CONTENT_CLASSES}>
            <p className="text-lg font-bold mb-2 text-text-font">
              Are you sure you want to cancel?
            </p>
            <div className="flex justify-end gap-2">
              <SecondaryButton
                size="small"
                onClick={() => setShowCancelConfirm(false)}
              >
                No
              </SecondaryButton>
              <ErrorOutlinedButton
                size="small"
                onClick={onClose}
              >
                Yes
              </ErrorOutlinedButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
