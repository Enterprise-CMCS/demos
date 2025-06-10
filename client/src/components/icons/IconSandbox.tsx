import React, { useState } from "react";
import * as Icons from "./index";

// explicitly list all icon components in a defined order, so they reflect the order of the Figma
const alertIcons = [
  Icons.Success,
  Icons.Error,
  Icons.Warning,
  Icons.Info,
  Icons.Fail,
  Icons.Null,
];
const inputIcons = [
  Icons.Search,
  Icons.Hint,
  Icons.Date,
  Icons.DateTime,
  Icons.Time,
  Icons.Resize,
];
const actionIcons = [
  Icons.Delete,
  Icons.Import,
  Icons.Export,
  Icons.Compare,
  Icons.AddNew,
  Icons.Printer,
  Icons.Settings,
  Icons.Metrics,
  Icons.Exclusion,
  Icons.Version,
  Icons.Stack,
  Icons.Ellipsis,
  Icons.Medication,
  Icons.Label,
  Icons.Highlight,
  Icons.Undo,
  Icons.Redo,
  Icons.Refresh,
  Icons.Refresh2,
  Icons.Send,
  Icons.Link,
  Icons.Resolve,
  Icons.FlaggedForSeverity,
  Icons.Unread,
  Icons.ThumbsUp,
  Icons.OnHold,
  Icons.Review,
  Icons.Submit,
  Icons.Sort,
];
const symbolIcons = [
  Icons.Comment,
  Icons.ScrollLock,
  Icons.Drag,
  Icons.Save,
  Icons.ChevronRight,
  Icons.ChevronLeft,
  Icons.ChevronUp,
  Icons.ChevronDown,
  Icons.Actions,
];
const navigationIcons = [
  Icons.Menu,
  Icons.Home,
  Icons.Filter,
  Icons.Flag,
  Icons.FlagFilled,
  Icons.Pin,
  Icons.Notify,
  Icons.Help,
  Icons.PinFilled,
  Icons.Location,
  Icons.Survey,
  Icons.Building,
  Icons.Attributes,
  Icons.Analytics,
  Icons.MenuCollapseRight,
  Icons.MenuCollapseLeft,
  Icons.ArrowUp,
  Icons.ArrowDown,
  Icons.Minimize,
  Icons.Maximize,
  Icons.Exit,
  Icons.Bookmark,
  Icons.Review,
  Icons.Folder,
  Icons.AddFolder,
  Icons.Edit,
  Icons.Characteristic,
  Icons.OpenFolder,
  Icons.Archive,
  Icons.File,
  Icons.Empty,
  Icons.Rotate,
  Icons.Word,
  Icons.PDF,
  Icons.ZoomIn,
  Icons.Load,
  Icons.Refresh,
  Icons.Inbox,
  Icons.NotifyFilled,
  Icons.Bullets,
  Icons.Logout,
  Icons.HintFilled,
  Icons.Profile,
  Icons.CaratDown,
  Icons.Favorite,
  Icons.Lock,
  Icons.Share,
  Icons.List,
  Icons.Email,
  Icons.Wallet,
  Icons.Scale,
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
        <label
          className="text-xs font-bold text-gray-700"
          htmlFor="icon-hue-slider"
        >
          Change Icon Color:
        </label>
        <input
          id="icon-hue-slider"
          type="range"
          min="-1"
          max="360"
          value={hue}
          onChange={(e) => setHue(Number(e.target.value))}
          className={"w-40"}
        />
      </form>
      {[alertIcons, inputIcons, actionIcons, symbolIcons, navigationIcons].map(
        (icons, idx) => (
          <div key={idx} className="mb-0">
            <div className="flex flex-wrap gap-1">
              {icons.map((Component) => (
                <div
                  key={Component.name}
                  className="flex flex-col items-center rounded"
                >
                  <span style={{ color }}>
                    <Component width="24" height="24" />
                  </span>
                  <span className="mt-0.5 text-[8px] text-gray-700">
                    {Component.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
};
