import { Collapsible } from "components/collapsible/Collapsible";
import { InputSandbox } from "components/input";
import { ButtonGrid } from "components/button";
import { RadioGroupSandbox } from "components/radioGroup";
import { CheckboxGroupSandbox } from "components/checkboxGroup";
import { ToastDemo } from "./ToastDemo";
import React from "react";
import { Notice } from "components/notice";

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
      <Collapsible title="Radio Group Sandbox (Click to expand)">
        <RadioGroupSandbox />
      </Collapsible>
      <Collapsible title="Toast Components (Click to expand)">
        <ToastDemo />
      </Collapsible>
      <Collapsible title="Checkbox Group Sandbox (Click to expand)">
        <CheckboxGroupSandbox />
      </Collapsible>
      <Collapsible title="notice sandbox">
        <Notice title="This is an info notice" variant="info" />
        <Notice title="This is a success notice" variant="success" />
        <Notice title="This is a warning notice" variant="warning" />
        <Notice title="This is an error notice" variant="error" />
      </Collapsible>
    </>
  );
};
