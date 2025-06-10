import React, { useState } from "react";
import { TextInput } from ".";
import { SelectDemoStatuses } from "./select/SelectDemoStatuses";
import { SelectUSAStates } from "./select/SelectUSAStates";
import { SelectUsers } from "./select/SelectUsers";

// TODO replace with our button when it's ready
const BUTTON_CLASS_NAME = "bg-brand text-white my-sm p-sm rounded-normal hover:bg-brand-dark";

const getValidationMessage = (value: string) => {
  if(value.includes("z")) {
    return "Input must not contain the letter z";
  }
  return "";
};

export const InputSandbox: React.FC = () => {
  const [disabled, setDisabled] = useState(false);
  const [isRequired, setIsRequired] = useState(false);
  const [status, setStatus] = useState<string>("");
  // We'll wire this up to use the current cache user id
  const currnetUserId = 123;

  return (
    <>
      <div className="flex gap-sm">
        <button className={BUTTON_CLASS_NAME} onClick={() => setDisabled((d) => !d)}>
          {disabled ? "Enable" : "Disable"}
        </button>
        <button className={BUTTON_CLASS_NAME} onClick={() => setIsRequired((r) => !r)}>
          {isRequired ? "Set Not Required" : "Set Required"}
        </button>
      </div>
      <TextInput
        name="test"
        label="Label (No Z's allowed)"
        isDisabled={disabled}
        getValidationMessage={getValidationMessage}
        isRequired={isRequired}
        placeholder="Placeholder"
      />
      <div className="mt-3">
        <SelectDemoStatuses
          isRequired={isRequired}
          isDisabled={disabled}
          onStatusChange={setStatus}
        />
      </div>
      <div className="mt-3">
        <SelectUSAStates
          isRequired={isRequired}
          isDisabled={disabled}
          onStateChange={setStatus}
        />
      </div>
      <div className="mt-3">
        <SelectUsers
          isRequired={isRequired}
          label="Project Officers"
          isDisabled={disabled}
          onStateChange={setStatus}
          currentUserId={String(currnetUserId)}
        />
      </div>
      {status && (
        <p className="mt-2">
          You most recently selected: <strong>{status}</strong>
        </p>
      )}
    </>
  );
};
