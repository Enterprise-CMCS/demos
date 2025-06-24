import { isDevelopmentMode } from "config/env";
import React from "react";

interface DebugOnlyProps {
  children: React.ReactNode;
}

export const DebugOnly: React.FC<DebugOnlyProps> = ({ children }) => {
  if (isDevelopmentMode()) {
    return <>{children}</>;
  } else {
    return null;
  }
};
