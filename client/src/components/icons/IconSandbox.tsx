import React, { useState } from "react";
import * as Icons from "./index";

// explicitly list all icon components in a defined order, so they reflect the order of the Figma
const alertIcons = [
  Icons.SuccessIcon,
  Icons.ErrorIcon,
  Icons.WarningIcon,
  Icons.InfoIcon,
  Icons.FailIcon,
  Icons.NullIcon,
  Icons.AlertIcon,
];
const inputIcons = [
  Icons.SearchIcon,
  Icons.HintIcon,
  Icons.DateIcon,
  Icons.DateTimeIcon,
  Icons.TimeIcon,
  Icons.ResizeIcon,
];
const actionIcons = [
  Icons.DeleteIcon,
  Icons.ImportIcon,
  Icons.ExportIcon,
  Icons.CompareIcon,
  Icons.AddNewIcon,
  Icons.PrinterIcon,
  Icons.SettingsIcon,
  Icons.MetricsIcon,
  Icons.ExclusionIcon,
  Icons.VersionIcon,
  Icons.StackIcon,
  Icons.EllipsisIcon,
  Icons.MedicationIcon,
  Icons.LabelIcon,
  Icons.HighlightIcon,
  Icons.UndoIcon,
  Icons.RedoIcon,
  Icons.RefreshIcon,
  Icons.Refresh2Icon,
  Icons.SendIcon,
  Icons.LinkIcon,
  Icons.ResolveIcon,
  Icons.FlaggedForSeverityIcon,
  Icons.UnreadIcon,
  Icons.ThumbsUpIcon,
  Icons.OnHoldIcon,
  Icons.ReviewIcon,
  Icons.SubmitIcon,
  Icons.SortIcon,
];
const symbolIcons = [
  Icons.CommentIcon,
  Icons.ScrollLockIcon,
  Icons.DragIcon,
  Icons.SaveIcon,
  Icons.ChevronRightIcon,
  Icons.ChevronLeftIcon,
  Icons.ChevronUpIcon,
  Icons.ChevronDownIcon,
  Icons.ActionsIcon,
];
const navigationIcons = [
  Icons.MenuIcon,
  Icons.HomeIcon,
  Icons.FilterIcon,
  Icons.FlagIcon,
  Icons.FlagFilledIcon,
  Icons.PinIcon,
  Icons.NotifyIcon,
  Icons.HelpIcon,
  Icons.PinFilledIcon,
  Icons.LocationIcon,
  Icons.SurveyIcon,
  Icons.BuildingIcon,
  Icons.AttributesIcon,
  Icons.AnalyticsIcon,
  Icons.MenuCollapseRightIcon,
  Icons.MenuCollapseLeftIcon,
  Icons.ArrowUpIcon,
  Icons.ArrowDownIcon,
  Icons.MinimizeIcon,
  Icons.MaximizeIcon,
  Icons.ExitIcon,
  Icons.BookmarkIcon,
  Icons.ReviewIcon,
  Icons.FolderIcon,
  Icons.AddFolderIcon,
  Icons.EditIcon,
  Icons.CharacteristicIcon,
  Icons.OpenFolderIcon,
  Icons.ArchiveIcon,
  Icons.FileIcon,
  Icons.EmptyIcon,
  Icons.RotateIcon,
  Icons.WordIcon,
  Icons.PDFIcon,
  Icons.ZoomInIcon,
  Icons.LoadIcon,
  Icons.RefreshIcon,
  Icons.InboxIcon,
  Icons.NotifyFilledIcon,
  Icons.BulletsIcon,
  Icons.LogoutIcon,
  Icons.HintFilledIcon,
  Icons.ProfileIcon,
  Icons.CaratDownIcon,
  Icons.FavoriteIcon,
  Icons.LockIcon,
  Icons.ShareIcon,
  Icons.ListIcon,
  Icons.EmailIcon,
  Icons.WalletIcon,
  Icons.ScaleIcon,
];

export const IconSandbox = () => {
  const [hue, setHue] = useState(-1);
  const color = hue === -1 ? "#000" : `hsl(${hue}, 80%, 45%)`;

  return (
    <div className="flex flex-col gap-2 mt-2">
      <form
        className="flex items-center gap-2 p-2 bg-gray-50 rounded shadow"
        onSubmit={(e) => e.preventDefault()}
      >
        <label className="text-xs font-bold text-gray-700" htmlFor="icon-hue-slider">
          Change Icon Color:
        </label>
        <input
          data-testid="input-hue-slider"
          id="icon-hue-slider"
          type="range"
          min="-1"
          max="360"
          value={hue}
          onChange={(e) => setHue(Number(e.target.value))}
          className={"w-40"}
        />
      </form>
      {[alertIcons, inputIcons, actionIcons, symbolIcons, navigationIcons].map((icons, idx) => (
        <div key={idx} className="mb-0">
          <div className="flex flex-wrap gap-1">
            {icons.map((Component) => (
              <div key={Component.name} className="flex flex-col items-center rounded">
                <span style={{ color }}>
                  <Component width="24" height="24" />
                </span>
                <span className="mt-0.5 text-[12px] text-gray-700">{Component.name}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
