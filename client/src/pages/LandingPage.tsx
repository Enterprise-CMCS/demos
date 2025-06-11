import React, { Fragment } from "react";
import { Main } from "components";
import { Demonstrations } from "pages/Demonstrations";

/** TODO: Look into if the Demonstration Page should just be the landing page */
export const LandingPage: React.FC = () => {
  return (
    <Fragment>
      <Main>
        <Demonstrations />
      </Main>
    </Fragment>
  );
};
