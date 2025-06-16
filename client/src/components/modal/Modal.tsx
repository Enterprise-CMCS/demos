import React from "react";

export const Modal: React.FC<{ onClose: () => void, children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="bg-[var(--color-surface-white)] border border-[var(--color-border-rules)] rounded shadow-lg w-[880px] max-w-[95vw]"
        style={{ color: "var(--color-text-font)" }}>
        {children}
      </div>
    </div>
  );
};
