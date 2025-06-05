import { Collapsible } from "components/collapsible/Collapsible";
import { Main } from "components";
import { InputSandbox } from "components/input";
import { ButtonGrid } from "components/button";
import React, { Fragment } from "react";
import { DatePickerSandbox } from "components/DatePicker.tsx/DatePickerSandbox";

export const ComponentLibrary: React.FC = () => {
  return (
    <Fragment>
      <Main>
        <Collapsible title="Button Grid (Click to expand)">
          <ButtonGrid />
        </Collapsible>
        <Collapsible title="Input Sandbox (Click to expand)">
          <InputSandbox />
        </Collapsible>
        <Collapsible title="DatePicker Sandbox (Click to expand)">
          <DatePickerSandbox />
        </Collapsible>
      </Main>
    </Fragment>
  );
};
