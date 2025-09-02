import React, { Fragment } from "react";

import { Demonstrations } from "pages/Demonstrations";

/** TODO: Look into if the Demonstration Page should just be the landing page */
export const LandingPage: React.FC = () => {
  return (
    <Fragment>
      {/* <script src="http://localhost:8097"></script> */}
      <Demonstrations />
    </Fragment>
  );
};
