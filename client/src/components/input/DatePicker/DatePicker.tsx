import React from "react";
import {
  DesktopDatePickerProps as MuiDatePickerProps,
  DesktopDatePicker as MuiDatePicker,
} from "@mui/x-date-pickers/DesktopDatePicker";
import {
  DesktopTimePicker as MuiTimePicker,
  DesktopTimePickerProps as MuiTimePickerProps,
} from "@mui/x-date-pickers/DesktopTimePicker";
import {
  DesktopDateTimePickerProps as MuiDateTimePickerProps,
  DesktopDateTimePicker as MuiDateTimePicker,
} from "@mui/x-date-pickers/DesktopDateTimePicker";
import { DateIcon, DateTimeIcon, TimeIcon } from "components/icons";
import { LABEL_CLASSES } from "components/input/Input";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

export const TYPE_DATE = "date";
export const TYPE_TIME = "time";
export const TYPE_DATETIME = "datetime";

type DatePickerProps = MuiDatePickerProps &
  MuiTimePickerProps &
  MuiDateTimePickerProps & {
    type?: string;
    required?: boolean;
    children?: React.ReactNode;
  };

export const DatePicker: React.FC<DatePickerProps> = (props) => {
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
    <LocalizationProvider dateAdapter={AdapterDateFns}>
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
          sx={{
            ".MuiPickersInputBase-sectionsContainer": {
              padding: "var(--spacing-1), var(--spacing-3);",
              paddingBlock: "var(--spacing-1)",
            },
            ".MuiPickersOutlinedInput-notchedOutline": {
              border: "1px solid #767676",
            },
          }}
          {...rest}
        />
      </div>
    </LocalizationProvider>
  );
};
