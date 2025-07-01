import React, { createContext, useContext, useState, ReactNode } from "react";

interface HeaderConfig {
  lowerContent?: ReactNode;
}

const HeaderConfigContext = createContext<{
  setHeaderConfig: (config: HeaderConfig) => void;
}>({
  setHeaderConfig: () => {},
});

export const useHeaderConfig = () => useContext(HeaderConfigContext);

export const HeaderConfigProvider: React.FC<{
  children: React.ReactNode;
  defaultLowerContent: React.ReactNode;
}> = ({ children, defaultLowerContent }) => {
  const [headerConfig, setHeaderConfig] = useState<HeaderConfig>({});

  const effectiveContent = headerConfig.lowerContent ?? defaultLowerContent;

  return (
    <HeaderConfigContext.Provider value={{ setHeaderConfig }}>
      {children}
      <div className="absolute top-12 w-full z-10">
        {effectiveContent}
      </div>
    </HeaderConfigContext.Provider>
  );
};
