import React, { useState } from "react";
import { RadioGroup } from "./RadioGroup";

// TODO replace with our button when it's ready
const BUTTON_CLASS_NAME =
  "bg-brand text-white my-sm p-sm rounded-normal hover:bg-brand-dark";

const getValidationMessage = (value: string) => {
  if (value === "pineapple") {
    return "Pineapple is a controversial pizza topping!";
  }
  return "";
};

export const RadioGroupSandbox: React.FC = () => {
  const [disabled, setDisabled] = useState(false);
  const [isRequired, setIsRequired] = useState(false);
  const [isInline, setIsInline] = useState(false);

  return (
    <div>
      <div className="flex gap-sm mb-sm">
        <button
          className={BUTTON_CLASS_NAME}
          onClick={() => setDisabled((d) => !d)}
        >
          {disabled ? "Enable" : "Disable"}
        </button>
        <button
          className={BUTTON_CLASS_NAME}
          onClick={() => setIsRequired((r) => !r)}
        >
          {isRequired ? "Set Not Required" : "Set Required"}
        </button>
        <button
          className={BUTTON_CLASS_NAME}
          onClick={() => setIsInline((r) => !r)}
        >
          {isInline ? "Set Not Inline" : "Set Inline"}
        </button>
      </div>
      <RadioGroup
        name="pizzaTopping"
        title="Favorite Pizza Topping"
        isDisabled={disabled}
        isRequired={isRequired}
        isInline={isInline}
        defaultValue="cheese"
        getValidationMessage={getValidationMessage}
        options={[
          { label: "Cheese", value: "cheese" },
          { label: "Pepperoni", value: "pepperoni" },
          { label: "Pineapple", value: "pineapple", helperText: "Do Not Chose This Option!" },
        ]}
      />
    </div>
  );
};
