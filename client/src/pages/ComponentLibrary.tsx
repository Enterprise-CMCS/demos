import Collapsible from "components/collapsible/Collapsible";
import { Footer, Header, Main } from "components";
import { InputSandbox } from "components/input";
import { ButtonGrid } from "components/button";
import React, { Fragment } from "react";

const ComponentLibrary: React.FC = () => {
  return (
    <Fragment>
      <Header />
      <Main>
        <Collapsible title="Button Grid (Click to expand)">
          <ButtonGrid />
        </Collapsible>
        <Collapsible title="Input Sandbox (Click to expand)">
          <InputSandbox />
        </Collapsible>
      </Main>
      <Footer />
    </Fragment>
  );
};

export default ComponentLibrary;
