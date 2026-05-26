import React from "react";

const LOGO_SRC = "/img/logo.svg";

export const Logo: React.FC = () => {
  return (
    <a href="/" className="h-[40px]">
      <img height="40px" src={LOGO_SRC} alt="Logo" />
    </a>
  );
};
