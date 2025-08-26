import React, { createContext, useContext, useState, ReactNode } from "react";

interface HeaderConfig {
  lowerContent?: ReactNode;
}

const HeaderConfigContext = createContext<{
  setHeaderConfig: (config: HeaderConfig) => void;
  effectiveContent: ReactNode;
}>({
  setHeaderConfig: () => {},
  effectiveContent: null,
});

export const useHeaderConfig = () => useContext(HeaderConfigContext);

export const HeaderConfigProvider: React.FC<{
  children: React.ReactNode;
  defaultLowerContent: React.ReactNode;
}> = ({ children, defaultLowerContent }) => {
  const [headerConfig, setHeaderConfig] = useState<HeaderConfig | null>(null);

  const effectiveContent = headerConfig?.lowerContent ?? defaultLowerContent;

  return (
    <HeaderConfigContext.Provider value={{ setHeaderConfig, effectiveContent }}>
      {children}
    </HeaderConfigContext.Provider>
  );
};
