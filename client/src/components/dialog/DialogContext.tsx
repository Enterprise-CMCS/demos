import React, { createContext, useContext, useState } from "react";

type ModalContextType = {
  isOpen: boolean;
  content: React.ReactNode | null;
  showModal: (content: React.ReactNode) => void;
  hideModal: () => void;
};

const ModalContext = createContext<ModalContextType | null>(null);

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modal, setModal] = useState<{ isOpen: boolean; content: React.ReactNode | null }>({
    isOpen: false,
    content: null,
  });

  const showModal = (content: React.ReactNode) => setModal({ isOpen: true, content });
  const hideModal = () => setModal({ isOpen: false, content: null });

  return (
    <ModalContext.Provider value={{ ...modal, showModal, hideModal }}>
      {children}
      {modal.isOpen && modal.content}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) throw new Error("useModal must be used within a ModalProvider");
  return context;
};
