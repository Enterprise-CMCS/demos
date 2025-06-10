import React, { useState } from "react";

import { PrimaryButton } from "components/button/PrimaryButton";
import { SecondaryButton } from "components/button/SecondaryButton";
import { TextInput } from "components/input/TextInput";

interface Props {
  onClose: () => void;
}

export const CreateNewModal: React.FC<Props> = ({ onClose }) => {
  const [state, setState] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [projectOfficer, setProjectOfficer] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Check if all required fields are filled
  const isFormValid =
    state &&
    title &&
    projectOfficer &&
    startDate &&
    endDate &&
    endDate >= startDate;

  console.log({ state, title, projectOfficer, startDate, endDate, isFormValid });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div
        className="bg-[var(--color-surface-white)] border border-[var(--color-border-rules)] rounded shadow-lg w-[880px] max-w-[95vw]"
        style={{ color: "var(--color-text-font)" }}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-1 pt-2 border-b border-[var(--color-border-rules)]">
          <h2 className="text-[22px] font-bold">New Demonstration</h2>
          <button
            onClick={onClose}
            className="text-[22px] text-[var(--color-text-placeholder)] hover:text-[var(--color-text-font)]"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form className="px-3 py-1 space-y-1 text-[14px]">
          {/* Row 1 */}
          <div className="grid grid-cols-3 gap-5">
            <div>
              <label className="block font-medium mb-1">
                <span className="text-[var(--color-text-warn)]">*</span> State/Territory
              </label>
              <select
                className="w-full border border-[var(--color-border-fields)] rounded px-1 py-1 bg-[var(--color-surface-white)] text-sm"
                value={state}
                onChange={e => setState(e.target.value)}
              >
                <option value="">Select</option>
                <option value="NJ">NJ</option>
                <option value="PA">PA</option>
                <option value="OH">OH</option>
              </select>
            </div>
            <div className="col-span-2">
              <TextInput
                name="title"
                label="Demonstration Title"
                isDisabled={false}
                isRequired={true}
                placeholder="Placeholder"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-2">
              <label className="block font-medium mb-1">
                <span className="text-[var(--color-text-warn)]">*</span> Project Officer
              </label>
              <select
                className="w-full border border-[var(--color-border-fields)] rounded px-1 py-1 bg-[var(--color-surface-white)] text-sm"
                value={projectOfficer}
                onChange={e => setProjectOfficer(e.target.value)}
              >
                <option value="">Select</option>
                <option value="John Doe">John Doe</option>
                <option value="Tess Davenport">Tess Davenport</option>
                <option value="Roger Smith">Roger Smith</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Start Date</label>
              <input
                type="date"
                className="w-full border border-[var(--color-border-fields)] rounded px-1 py-1 text-sm"
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value);
                  if (endDate && e.target.value && endDate < e.target.value) {
                    setEndDate("");
                  }
                }}
              />
            </div>
            <div>
              <label className="block font-medium mb-1">End Date</label>
              <input
                type="date"
                className="w-full border border-[var(--color-border-fields)] rounded px-1 py-1 text-sm"
                value={endDate}
                min={startDate || undefined}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>
          {/* Row 3 */}
          <div>
            <label className="block font-medium mb-1">Demonstration Description</label>
            <textarea
              placeholder="Enter"
              className="w-full border border-[var(--color-border-fields)] rounded px-1 py-1 text-sm resize-y min-h-[80px]"
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-1">
            <SecondaryButton
              size="small"
              onClick={onClose}
            >
              Cancel
            </SecondaryButton>
            <PrimaryButton
              size="small"
              disabled={!isFormValid}
            >
              Submit
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
};
