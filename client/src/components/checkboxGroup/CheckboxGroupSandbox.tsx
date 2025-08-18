import React, { useState } from "react";
import { CheckboxGroup } from "./CheckboxGroup";
import { Button } from "components/button";

export const CheckboxGroupSandbox: React.FC = () => {
  const [disabled, setDisabled] = useState(false);
  const [isRequired, setIsRequired] = useState(false);
  const [isInline, setIsInline] = useState(false);

  return (
    <div>
      <div className="flex gap-sm mb-sm">
        <Button name="cg-set-enabled" onClick={() => setDisabled((d) => !d)}>
          {disabled ? "Enable" : "Disable"}
        </Button>
        <Button name="cg-set-required" onClick={() => setIsRequired((r) => !r)}>
          {isRequired ? "Set Not Required" : "Set Required"}
        </Button>
        <Button name="cg-set-inline" onClick={() => setIsInline((r) => !r)}>
          {isInline ? "Set Not Inline" : "Set Inline"}
        </Button>
      </div>
      <CheckboxGroup
        name="toppings"
        label="Select Toppings"
        options={[
          { label: "Cheese", value: "cheese" },
          { label: "Pepperoni", value: "pepperoni" },
          { label: "Pineapple", value: "pineapple", helperText: "Do Not Chose This Option!" },
        ]}
        defaultValues={["cheese"]}
        isDisabled={disabled}
        isRequired={isRequired}
        isInline={isInline}
        getValidationMessage={(values) =>
          values.length === 0 ? "At least one topping must be selected." : ""
        }
      />
    </div>
  );
};
