import React from "react";
import { DatePicker as MuiDatePicker } from "@mui/x-date-pickers/DatePicker";
import { DateIcon } from "components/icons";

// import { styled, useThemeProps } from "@mui/material/styles";
// import Typography from "@mui/material/Typography";
// import Stack from "@mui/material/Stack";
// import IconButton from "@mui/material/IconButton";
// import ChevronLeft from "@mui/icons-material/ChevronLeft";
// import ChevronRight from "@mui/icons-material/ChevronRight";
// import KeyboardDoubleArrowLeftIcon from "@mui/icons-material/KeyboardDoubleArrowLeft";
// import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
// import { PickersCalendarHeaderProps } from "@mui/x-date-pickers/PickersCalendarHeader";
// import { PickersCalendarHeader } from "@mui/x-date-pickers/PickersCalendarHeader";
// import { usePickerTranslations } from "@mui/x-date-pickers";
// import { usePickerPrivateContext, useUtils } from "@mui/x-date-pickers/internals";

// const CustomCalendarHeaderRoot = styled("div")({
//   display: "flex",
//   justifyContent: "space-between",
//   padding: "8px 16px",
//   alignItems: "center",
// });

// const CustomCalendarHeader = React.forwardRef(function PickersCalendarHeader(
//   inProps: PickersCalendarHeaderProps,
//   ref: React.Ref<HTMLDivElement>
// ) {
//   const translations = usePickerTranslations();
//   const utils = useUtils();

//   const props = useThemeProps({ props: inProps, name: "MuiPickersCalendarHeader" });

//   const {
//     slots,
//     slotProps,
//     currentMonth: month,
//     disabled,
//     disableFuture,
//     disablePast,
//     maxDate,
//     minDate,
//     onMonthChange,
//     onViewChange,
//     view,
//     reduceAnimations,
//     views,
//     labelId,
//     className,
//     classes: classesProp,
//     timezone,
//     format = `${utils.formats.month} ${utils.formats.year}`,
//     ...other
//   } = props;

//   const { ownerState } = usePickerPrivateContext();
//   const classes = useUtilityClasses(classesProp);

//   const SwitchViewButton = slots?.switchViewButton ?? PickersCalendarHeaderSwitchViewButton;
//   const switchViewButtonProps = useSlotProps({
//     elementType: SwitchViewButton,
//     externalSlotProps: slotProps?.switchViewButton,
//     additionalProps: {
//       size: 'small',
//       'aria-label': translations.calendarViewSwitchingButtonAriaLabel(view),
//     },
//     ownerState,
//     className: classes.switchViewButton,
//   });

//   const SwitchViewIcon = slots?.switchViewIcon ?? PickersCalendarHeaderSwitchViewIcon;
//   // The spread is here to avoid this bug mui/material-ui#34056
//   const { ownerState: switchViewIconOwnerState, ...switchViewIconProps } = useSlotProps({
//     elementType: SwitchViewIcon,
//     externalSlotProps: slotProps?.switchViewIcon,
//     ownerState,
//     className: classes.switchViewIcon,
//   });

//   const selectNextMonth = () => onMonthChange(utils.addMonths(month, 1));
//   const selectPreviousMonth = () => onMonthChange(utils.addMonths(month, -1));

//   const isNextMonthDisabled = useNextMonthDisable(month, {
//     disableFuture,
//     maxDate,
//     timezone,
//   });
//   const isPreviousMonthDisabled = usePreviousMonthDisabled(month, {
//     disablePast,
//     minDate,
//     timezone,
//   });

//   const handleToggleView = () => {
//     if (views.length === 1 || !onViewChange || disabled) {
//       return;
//     }

//     if (views.length === 2) {
//       onViewChange(views.find((el) => el !== view) || views[0]);
//     } else {
//       // switching only between first 2
//       const nextIndexToOpen = views.indexOf(view) !== 0 ? 0 : 1;
//       onViewChange(views[nextIndexToOpen]);
//     }
//   };

//   // No need to display more information
//   if (views.length === 1 && views[0] === 'year') {
//     return null;
//   }

//   const label = utils.formatByString(month, format);

//   return (
//     <PickersCalendarHeaderRoot
//       {...other}
//       ownerState={ownerState}
//       className={clsx(classes.root, className)}
//       ref={ref}
//     >
//       <PickersCalendarHeaderLabelContainer
//         role="presentation"
//         onClick={handleToggleView}
//         ownerState={ownerState}
//         // putting this on the label item element below breaks when using transition
//         aria-live="polite"
//         className={classes.labelContainer}
//       >
//         <PickersFadeTransitionGroup reduceAnimations={reduceAnimations} transKey={label}>
//           <PickersCalendarHeaderLabel
//             id={labelId}
//             data-testid="calendar-month-and-year-text"
//             ownerState={ownerState}
//             className={classes.label}
//           >
//             {label}
//           </PickersCalendarHeaderLabel>
//         </PickersFadeTransitionGroup>
//         {views.length > 1 && !disabled && (
//           <SwitchViewButton {...switchViewButtonProps}>
//             <SwitchViewIcon {...switchViewIconProps} />
//           </SwitchViewButton>
//         )}
//       </PickersCalendarHeaderLabelContainer>
//       <Fade in={view === 'day'} appear={!reduceAnimations} enter={!reduceAnimations}>
//         <PickersArrowSwitcher
//           slots={slots}
//           slotProps={slotProps}
//           onGoToPrevious={selectPreviousMonth}
//           isPreviousDisabled={isPreviousMonthDisabled}
//           previousLabel={translations.previousMonth}
//           onGoToNext={selectNextMonth}
//           isNextDisabled={isNextMonthDisabled}
//           nextLabel={translations.nextMonth}
//         />
//       </Fade>
//     </PickersCalendarHeaderRoot>
//   );
// }) as PickersCalendarHeaderComponent;

export const DatePicker: React.FC<{
  label: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}> = ({ label, placeholder, required, disabled }) => {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-bold">
        {required && <span className="text-red-600 mr-1">*</span>}
        {label}
      </label>
      <MuiDatePicker
        label={placeholder}
        disabled={disabled}
        slotProps={{
          textField: {
            required: required,
            size: "small",
            InputProps: {
              className: disabled
                ? "bg-gray-200 cursor-not-allowed"
                : "bg-white",
            },
          },
          // Style the calendar header slot
          calendarHeader: {
            format: "MMMM YYYY",
          },
        }}
        slots={{
          openPickerIcon: DateIcon,
          // calendarHeader: CustomCalendarHeader,
        }}
        name={label}
      />
    </div>
  );
};
