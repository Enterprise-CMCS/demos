import React from "react";
import { STATES_AND_TERRITORIES } from "demos-server-constants";
import { Collapsible } from "components/collapsible/Collapsible";
import { getColumnBuilder, KeywordSearch, PaginationControls, Table } from "components/table";

type StateOrTerritory = (typeof STATES_AND_TERRITORIES)[number];

const STATE_ROWS: StateOrTerritory[] = [...STATES_AND_TERRITORIES];

const { createColumn } = getColumnBuilder<StateOrTerritory>();

const STATE_COLUMNS = [createColumn((row) => row.name, "State / Territory")];

export const TablesSandbox: React.FC = () => {
  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Tables Sandbox</h1>
      <Collapsible title="State / Territory Table (Click to expand)">
        <Table<StateOrTerritory>
          keywordSearch={(table) => <KeywordSearch table={table} />}
          pagination={(table) => <PaginationControls table={table} />}
          data={STATE_ROWS}
          columns={STATE_COLUMNS}
          descriptionText="All states and territories."
        />
      </Collapsible>
    </>
  );
};
