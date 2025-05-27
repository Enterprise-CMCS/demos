import React from "react";

interface DebugOnlyProps {
    children: React.ReactNode;
}

const DebugOnly: React.FC<DebugOnlyProps> = ({ children }) => {
  if (process.env.NODE_ENV === "development"){
    return <>{children}</>;
  } else {
    return null;
  }
};

export default DebugOnly;
