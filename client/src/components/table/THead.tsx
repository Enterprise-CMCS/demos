import * as React from "react";

import { flexRender, HeaderGroup } from "@tanstack/react-table";

import { ChevronDownIcon, ChevronUpIcon, SortIcon } from "components/icons";

const TH = "bg-gray-primary-layout p-1 font-semibold text-left border-b";
const TR = "h-[56px] border-b p-1";

export function THead<T>({ headerGroups }: { headerGroups: HeaderGroup<T>[] }) {
  return (
    <thead>
      {headerGroups.map((hg) => (
        <tr key={hg.id} className={TR}>
          {hg.headers.map((header) => {
            const canSort = header.column.getCanSort();
            const isSorted = header.column.getIsSorted();
            const ariaSortValue =
              isSorted === "asc"
                ? ("ascending" as const)
                : isSorted === "desc"
                  ? ("descending" as const)
                  : ("none" as const);
            return (
              <th
                key={header.id}
                scope="col"
                className={`${TH}${canSort ? " cursor-pointer select-none" : ""}`}
                {...(canSort
                  ? {
                    tabIndex: 0,
                    onClick: header.column.getToggleSortingHandler(),
                    onKeyDown: (e: React.KeyboardEvent<HTMLTableCellElement>) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        header.column.getToggleSortingHandler()?.(
                          e as unknown as React.MouseEvent
                        );
                      }
                    },
                    "aria-sort": ariaSortValue,
                  }
                  : {})}
              >
                <div className="flex items-center gap-1">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {canSort && (
                    <>
                      {{
                        asc: <ChevronUpIcon width={10} />,
                        desc: <ChevronDownIcon width={10} />,
                      }[isSorted as string] ?? <SortIcon width={8} />}
                    </>
                  )}
                </div>
              </th>
            );
          })}
        </tr>
      ))}
    </thead>
  );
}
