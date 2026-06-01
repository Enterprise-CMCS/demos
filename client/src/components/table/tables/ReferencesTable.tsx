import React from "react";
import { Table } from "../Table";
import { ReferencesColumns } from "../columns/ReferencesColumns";
import { TagName } from "demos-server";

export type ReferenceAgreement = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type Reference = {
  id: string;
  name: string;
  description: string;
  agreement: ReferenceAgreement | null;
  referenceTags: TagName[];
  demonstrationTypes: TagName[];
  createdAt: string;
  updatedAt: string;
};

const mockReferences: Reference[] = [
  {
    id: "ref1",
    name: "Reference Document 1",
    description: "Description for Reference Document 1",
    agreement: {
      id: "agreement1",
      name: "Reference Agreement 1",
      createdAt: "2024-01-01",
      updatedAt: "2024-01-02",
    },
    referenceTags: ["Tag1", "Tag2"],
    demonstrationTypes: ["Type A", "Type B"],
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
  {
    id: "ref2",
    name: "Reference Document 2",
    description: "Description for Reference Document 2",
    agreement: null,
    referenceTags: ["Tag3"],
    demonstrationTypes: ["Type C"],
    createdAt: "2024-01-03",
    updatedAt: "2024-01-04",
  },
];

export const ReferencesTable: React.FC = () => {
  const referencesColumns = ReferencesColumns();

  return (
    <div className="flex flex-col">
      {referencesColumns && <Table<Reference> data={mockReferences} columns={referencesColumns} />}
    </div>
  );
};
