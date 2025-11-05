import React, { createContext, useContext, useState } from "react";
import { CreateDemonstrationDialog } from "./demonstration/CreateDemonstrationDialog";
import { AmendmentDialog } from "./AmendmentDialog";
import { ExtensionDialog } from "./ExtensionDialog";
import { EditDemonstrationDialog } from "./demonstration";
// Import your dialog component

type DialogContextType = {
  content: React.ReactNode | null;
  showDialog: (content: React.ReactNode) => void;
  hideDialog: () => void;
};

const DialogContext = createContext<DialogContextType | null>(null);

export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [content, setContent] = useState<React.ReactNode | null>(null);

  const showDialog = (dialogContent: React.ReactNode) => setContent(dialogContent);
  const hideDialog = () => setContent(null);

  return (
    <DialogContext.Provider value={{ content, showDialog, hideDialog }}>
      {children}
      {content}
    </DialogContext.Provider>
  );
};

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) throw new Error("useDialog must be used within a DialogProvider");

  // Custom show function for CreateDemonstrationDialog
  const showCreateDemonstrationDialog = () => {
    context.showDialog(<CreateDemonstrationDialog onClose={context.hideDialog} />);
  };

  const showEditDemonstrationDialog = (demonstrationId: string) => {
    context.showDialog(
      <EditDemonstrationDialog demonstrationId={demonstrationId} onClose={context.hideDialog} />
    );
  };

  const showCreateAmendmentDialog = (demonstrationId?: string) => {
    context.showDialog(
      <AmendmentDialog demonstrationId={demonstrationId} mode="add" onClose={context.hideDialog} />
    );
  };

  const showCreateExtensionDialog = (demonstrationId?: string) => {
    context.showDialog(
      <ExtensionDialog demonstrationId={demonstrationId} mode="add" onClose={context.hideDialog} />
    );
  };

  return {
    showCreateDemonstrationDialog,
    showEditDemonstrationDialog,
    showCreateAmendmentDialog,
    showCreateExtensionDialog,
  };
};
