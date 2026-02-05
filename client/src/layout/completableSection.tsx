import React, { useLayoutEffect } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "components/icons";
import { CompletenessBadge } from "components/badge/CompletenessBadge";

export const CompletableSection = ({
  isComplete,
  title,
  children,
  completionDate,
}: {
  isComplete: boolean;
  title: string;
  children: React.ReactNode;
  completionDate?: string;
}) => {
  const [isExpanded, setIsExpanded] = React.useState<boolean>(() => !isComplete);

  useLayoutEffect(() => {
    if (isComplete) {
      setIsExpanded(false);
    }
  }, [isComplete]);

  const sectionId = title.replace(/\s+/g, "-").toLowerCase();
  return (
    <section className="col-span-4 border-1 border-gray-dark rounded-md gap-1">
      <button
        aria-label={`${title}, ${isComplete ? "complete" : "incomplete"}, ${isExpanded ? "collapse" : "expand"} section`}
        className="flex items-center justify-between cursor-pointer px-2 py-1 gap-1 w-full text-left"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls={`section-${sectionId}`}
      >
        <h4 id={`heading-${sectionId}`} className="text-xl font-bold text-black">
          {title}
        </h4>
        <div className="flex items-center gap-2 mr-1">
          {completionDate && (
            <span className="text-xs text-text-placeholder" data-testid="application-details-completion-date">
              Completed on {completionDate}
            </span>
          )}
          <CompletenessBadge isComplete={isComplete} />
          {isExpanded ? (
            <ChevronDownIcon className="h-2 w-2 text-brand" />
          ) : (
            <ChevronRightIcon className="h-2 w-2 text-brand" />
          )}
        </div>
      </button>
      {isExpanded && (
        <div
          className="pr-2 pb-2 pl-2"
          id={`section-${sectionId}`}
          role="region"
          aria-labelledby={`heading-${sectionId}`}
        >
          <div className="border-t-1 border-gray-dark">{children}</div>
        </div>
      )}
    </section>
  );
};
