import React from "react";
import { DatePicker } from "./DatePicker";

export const DatePickerSandbox: React.FC = () => {
  // default, hover, focus, disabled, selected, filled, error
  return (
    <div>
      <DatePicker label="Default DatePicker" />
      <DatePicker label="DatePicker with Placeholder" placeholder="Placeholder" />
      <DatePicker label="Required DatePicker" required={true} />
      <DatePicker label="Disabled DatePicker" disabled={true}/>
      <DatePicker label="Basic DatePicker" />
      <DatePicker label="Basic DatePicker" />
    </div>
  );
};
