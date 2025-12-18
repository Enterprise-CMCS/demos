import React from "react";
import { ChevronDownIcon, ChevronRightIcon } from "components/icons";
import { CompletenessBadge } from "components/badge/CompletenessBadge";

export const CompletableSection = ({
  isComplete,
  isExpanded,
  setIsExpanded,
  title,
  children,
}: {
  isComplete: boolean;
  isExpanded: boolean;
  setIsExpanded: (val: boolean) => void;
  title: string;
  children: React.ReactNode;
}) => {
  return (
    <div className="col-span-4 border-1 border-gray-dark rounded-md gap-1">
      <div
        className="flex items-center justify-between cursor-pointer px-2 py-1 gap-1"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <h4 className="text-xl font-bold text-black">{title}</h4>
        </div>
        <div className="flex items-center gap-2 mr-1">
          <CompletenessBadge isComplete={isComplete} />
          {isExpanded ? (
            <ChevronRightIcon className="h-2 w-2 text-brand" />
          ) : (
            <ChevronDownIcon className="h-2 w-2 text-brand" />
          )}
        </div>
      </div>
      {isExpanded && (
        <div className="pr-2 pb-2 pl-2">
          <div className="border-t-1 border-gray-dark">{children}</div>
        </div>
      )}
    </div>
  );
};
