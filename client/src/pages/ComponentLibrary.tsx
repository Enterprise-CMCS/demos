import Collapsible from "components/collapsible/Collapsible";
import { Footer, Main } from "components";
import { InputSandbox } from "components/input";
import { ButtonGrid } from "components/button";
import React, { Fragment } from "react";

const ComponentLibrary: React.FC = () => {
  return (
    <Fragment>
      <Main>
        <Collapsible title="Button Grid (Click to expand)">
          <ButtonGrid />
        </Collapsible>
        <Collapsible title="Input Sandbox (Click to expand)">
          <InputSandbox />
        </Collapsible>
      </Main>
    </Fragment>
  );
};

export default ComponentLibrary;
