import { Collapsible } from "components/collapsible/Collapsible";
import { InputSandbox } from "components/input";
import { ButtonGrid } from "components/button";
import { RadioGroupSandbox } from "components/radioGroup";
import { CheckboxGroupSandbox } from "components/checkboxGroup";
import { ToastDemo } from "./ToastDemo";
import React from "react";
import { DatePickerSandbox } from "components/input/DatePicker.tsx/DatePickerSandbox";

export const ComponentLibrary: React.FC = () => {
  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Component Library</h1>
      <Collapsible title="Button Grid (Click to expand)">
        <ButtonGrid />
      </Collapsible>
      <Collapsible title="Input Sandbox (Click to expand)">
        <InputSandbox />
      </Collapsible>
      <Collapsible title="DatePicker Sandbox (Click to expand)">
        <DatePickerSandbox />
      </Collapsible>
      <Collapsible title="Radio Group Sandbox (Click to expand)">
        <RadioGroupSandbox />
      </Collapsible>
      <Collapsible title="Toast Components (Click to expand)">
        <ToastDemo />
      </Collapsible>
      <Collapsible title="Checkbox Group Sandbox (Click to expand)">
        <CheckboxGroupSandbox />
      </Collapsible>
    </>
  );
};
