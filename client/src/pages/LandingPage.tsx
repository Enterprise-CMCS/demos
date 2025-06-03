import React, { Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { Header, Main, Footer } from "components";
import { PrimaryButton } from "components/button/PrimaryButton";

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Fragment>
      <Header />
      <Main>
        <PrimaryButton onClick={() => navigate("/login")} className="mb-4">
          Login
        </PrimaryButton>
      </Main>
      <Footer />
    </Fragment>
  );
};
