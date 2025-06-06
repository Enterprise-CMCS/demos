import React from "react";
import { BaseToast } from "./BaseToast";

interface InfoToastProps {
  message: string;
}

export const InfoToast: React.FC<InfoToastProps> = ({
  message,
}) => (
  <BaseToast toastType="info" message={message}/>
);
