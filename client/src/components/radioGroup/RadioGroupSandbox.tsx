import React, { useState } from "react";
import { RadioGroup } from "./RadioGroup";
import { Button } from "components/button";

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
        <Button name="rg-set-enabled" onClick={() => setDisabled((d) => !d)}>
          {disabled ? "Enable" : "Disable"}
        </Button>
        <Button name="rg-set-required" onClick={() => setIsRequired((r) => !r)}>
          {isRequired ? "Set Not Required" : "Set Required"}
        </Button>
        <Button name="rg-set-inline" onClick={() => setIsInline((r) => !r)}>
          {isInline ? "Set Not Inline" : "Set Inline"}
        </Button>
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
