import React, { useState } from "react";
import { TextInput } from ".";

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

  return (
    <div>
      <div>
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
      </div>
    </div>
  );
};
