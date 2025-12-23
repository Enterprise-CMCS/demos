import React, { useEffect, useRef } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "components/icons";
import { CompletenessBadge } from "components/badge/CompletenessBadge";

export const CompletableSection = ({
  isComplete,
  title,
  children,
}: {
  isComplete: boolean;
  title: string;
  children: React.ReactNode;
}) => {
  const [isExpanded, setIsExpanded] = React.useState<boolean>(true);

  const previousIsComplete = useRef(isComplete);

  useEffect(() => {
    if (previousIsComplete.current === false && isComplete === true) {
      setIsExpanded(false);
    }
    previousIsComplete.current = isComplete;
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
