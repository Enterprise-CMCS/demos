import { DemonstrationStatus } from "demos-server";

export const demonstrationStatuses: DemonstrationStatus[] = [
  {
    id: "12345678-1234-1234-1234-000000000001",
    name: "Active",
    description: "Demonstration is currently active.",
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    demonstrations: [],
  },
  {
    id: "12345678-1234-1234-1234-000000000002",
    name: "Approved",
    description: "Demonstration has been officially approved.",
    createdAt: new Date("2025-01-02"),
    updatedAt: new Date("2025-01-02"),
    demonstrations: [],
  },
  {
    id: "12345678-1234-1234-1234-000000000003",
    name: "Expired",
    description: "Demonstration has expired and is no longer active.",
    createdAt: new Date("2025-01-03"),
    updatedAt: new Date("2025-01-03"),
    demonstrations: [],
  },
  {
    id: "12345678-1234-1234-1234-000000000004",
    name: "Withdrawn",
    description: "Demonstration was withdrawn before completion.",
    createdAt: new Date("2025-01-04"),
    updatedAt: new Date("2025-01-04"),
    demonstrations: [],
  },
];
