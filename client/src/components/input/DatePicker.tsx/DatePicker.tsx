import React from "react";
import { DatePickerProps, DatePicker as MuiDatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker as MuiTimePicker, TimePickerProps } from "@mui/x-date-pickers/TimePicker";
import { DateTimePickerProps, DateTimePicker as MuiDateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { DateIcon, DateTimeIcon, TimeIcon } from "components/icons";
import { LABEL_CLASSES } from "components/input/Input";

export const TYPE_DATE = "date";
export const TYPE_TIME = "time";
export const TYPE_DATETIME = "datetime";

// Compose all possible picker props from MUI
type DatePickerProps123 = DatePickerProps & TimePickerProps & DateTimePickerProps & {
  type?: string;
  required?: boolean
  children?: React.ReactNode
}

export const DatePicker: React.FC<DatePickerProps123> = (props) => {
  const { type, children, required, ...rest } = props;

  let Picker: React.ElementType;
  let Icon: React.ElementType;

  switch (type) {
    case TYPE_TIME:
      Picker = MuiTimePicker;
      Icon = TimeIcon;
      break;
    case TYPE_DATETIME:
      Picker = MuiDateTimePicker;
      Icon = DateTimeIcon;
      break;
    case TYPE_DATE:
    default:
      Picker = MuiDatePicker;
      Icon = DateIcon;
  }

  return (
    <div className="flex flex-col gap-1">
      {children && (
        <label className={LABEL_CLASSES}>
          {required && <span className="text-text-warn">*</span>}
          {children}
        </label>
      )}
      <Picker
        slots={{
          openPickerIcon: Icon,
        }}
        {...rest}
      />
    </div>
  );
};
