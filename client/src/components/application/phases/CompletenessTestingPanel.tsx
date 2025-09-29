import React from "react";

type CompletenessTestingPanelProps = {
  onAddMockDoc: () => void;
  completenessDocCount: number;
  noticeDueDate: string;
  onNoticeDueDateChange: (value: string) => void;
  noticeDaysValue: number | null;
  onResetNotice: () => void;
};

export const CompletenessTestingPanel: React.FC<CompletenessTestingPanelProps> = ({
  onAddMockDoc,
  completenessDocCount,
  noticeDueDate,
  onNoticeDueDateChange,
  noticeDaysValue,
  onResetNotice,
}) => (
  <div className="mb-4 mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
    <div className="flex flex-wrap items-center gap-3 text-xs">
      <button
        onClick={onAddMockDoc}
        className="rounded bg-blue-100 px-3 py-1 text-blue-700 transition-colors hover:bg-blue-200"
        data-testid="add-mock-completeness-doc"
      >
        Add Mock Completeness Doc
      </button>
      <span className="text-gray-600">Docs: {completenessDocCount}</span>
      <label className="flex items-center gap-2 text-gray-700">
        <span className="font-semibold">Notice due date</span>
        <input
          type="date"
          value={noticeDueDate}
          data-testid="notice-due-date"
          onChange={(event) => onNoticeDueDateChange(event.target.value)}
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
          data-form-type="other"
          className="rounded border border-border-fields px-2 py-1 text-xs"
        />
      </label>
      <span className="text-gray-600">Displayed days: {noticeDaysValue ?? "--"}</span>
      <button
        onClick={onResetNotice}
        className="rounded border border-action px-3 py-1 text-action transition-colors hover:bg-action hover:text-white"
      >
        Reset Notice
      </button>
    </div>
  </div>
);
