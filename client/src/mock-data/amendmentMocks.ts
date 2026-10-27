import { Amendment } from "demos-server";
import { mockDocuments } from "./documentMocks";

export type MockAmendment = Pick<
  Amendment,
  "id" | "name" | "effectivePlainDate" | "createdAt" | "status" | "documents"
>;

export const mockAmendments: MockAmendment[] = [
  {
    id: "1",
    name: "Amendment 1 - Montana Medicaid Waiver",
    effectivePlainDate: "2025-01-01",
    status: "Under Review",
    createdAt: new Date(2024, 4, 30),
    documents: mockDocuments,
  },
  {
    id: "4",
    name: "Amendment 4 - Florida Health Innovation",
    effectivePlainDate: "2025-04-01",
    status: "Under Review",
    createdAt: new Date(2024, 6, 1),
    documents: [],
  },
  {
    id: "5",
    name: "Amendment 5 - Florida Health Innovation",
    effectivePlainDate: "2025-05-01",
    status: "Denied",
    createdAt: new Date(2024, 6, 15),
    documents: [],
  },
  {
    id: "6",
    name: "Amendment 6 - Florida Health Innovation",
    effectivePlainDate: undefined,
    status: "Denied",
    createdAt: new Date(2024, 6, 20),
    documents: [],
  },
];
