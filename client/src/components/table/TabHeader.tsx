import React from "react";

interface TabHeaderProps {
  title: string;
  children?: React.ReactNode;
  className?: string;
}

export const TabHeader: React.FC<TabHeaderProps> = ({ title, children, className = "" }) => {
  return (
    <div
      className={`flex justify-between items-center mb-md border-b border-gray-200 pb-1 ${className}`}
    >
      <h2 className="text-brand font-bold text-md uppercase tracking-wide">{title}</h2>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
};
