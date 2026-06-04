import * as React from "react";

import { flexRender, Header, HeaderGroup } from "@tanstack/react-table";

import { ChevronDownIcon, ChevronUpIcon, SortIcon } from "components/icons";

const STYLES = {
  TH: "bg-gray-primary-layout p-1 font-semibold text-left border-b",
  TR: "h-[56px] border-b p-1",
};

function getSortProps<T>(header: Header<T, unknown>) {
  const isSorted = header.column.getIsSorted();
  const ariaSortValue =
    isSorted === "asc"
      ? ("ascending" as const)
      : isSorted === "desc"
        ? ("descending" as const)
        : ("none" as const);

  const toggleSorting = header.column.getToggleSortingHandler();

  return {
    tabIndex: 0,
    "aria-sort": ariaSortValue,
    onClick: toggleSorting,
    onKeyDown: (e: React.KeyboardEvent<HTMLTableCellElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleSorting?.(e as unknown as React.MouseEvent);
      }
    },
  };
}

export function TableHead<T>({ headerGroups }: { headerGroups: HeaderGroup<T>[] }) {
  return (
    <thead>
      {headerGroups.map((hg) => (
        <tr key={hg.id} className={STYLES.TR}>
          {hg.headers.map((header) => {
            const canSort = header.column.getCanSort();
            const isSorted = header.column.getIsSorted();
            return (
              <th
                key={header.id}
                scope="col"
                className={`${STYLES.TH}${canSort ? " cursor-pointer select-none" : ""}`}
                {...(canSort ? getSortProps(header) : {})}
              >
                <div className="flex items-center gap-1">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {canSort &&
                    ({
                      asc: <ChevronUpIcon width={10} />,
                      desc: <ChevronDownIcon width={10} />,
                    }[isSorted as string] ?? <SortIcon width={8} />)}
                </div>
              </th>
            );
          })}
        </tr>
      ))}
    </thead>
  );
}
