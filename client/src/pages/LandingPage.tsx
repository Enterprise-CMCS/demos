import React, { Fragment } from "react";
import { Main } from "components";
import { PrimaryButton } from "components/button/PrimaryButton";

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Fragment>
      <Main>
        <PrimaryButton onClick={() => navigate("/login")} className="mb-4">
          Login
        </PrimaryButton>
      </Main>
    </Fragment>
  );
};
