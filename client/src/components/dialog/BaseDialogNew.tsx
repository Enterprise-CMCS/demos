import React from "react";
import { BaseDialog, BaseDialogProps } from "./BaseDialog";

export const BaseDialogNew: React.FC<Omit<BaseDialogProps, "isOpen">> = (props) => (
  <BaseDialog {...props} />
);
