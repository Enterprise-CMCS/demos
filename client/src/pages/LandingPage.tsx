import React, { Fragment } from "react";
import { Header, Main, Footer } from "components";

const LandingPage: React.FC = () => {
  return (
    <Fragment>
      <Header />
      <Main>
        <h1 className="text-2xl font-bold">Welcome to DEMOS</h1>
        <a href="/login">
          <button
            className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 cursor:pointer"
          >Go to Login page</button>
        </a>
      </Main>
      <Footer />
    </Fragment>
  );
};

export default LandingPage;
