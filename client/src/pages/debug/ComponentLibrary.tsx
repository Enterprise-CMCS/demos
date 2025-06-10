import { Collapsible } from "components/collapsible/Collapsible";
import { InputSandbox } from "components/input";
import { ButtonGrid } from "components/button";
import React from "react";

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
    </>
  );
};
