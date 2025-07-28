import { AddDemonstrationInput, Demonstration } from "demos-server";
import { activeDemonstrationStatus } from "./demonstrationStatusMocks";
import { california } from "./stateMocks";
import { johnDoe } from "./userMocks";
import {
  ADD_DEMONSTRATION_QUERY,
  DEMONSTRATION_TABLE_QUERY,
  GET_ALL_DEMONSTRATIONS_QUERY,
  GET_DEMONSTRATION_BY_ID_QUERY,
  UPDATE_DEMONSTRATION_MUTATION,
} from "queries/demonstrationQueries";
import { MockedResponse } from "@apollo/client/testing";
import { DemonstrationTableItem } from "hooks/useDemonstration";

export const testDemonstration: Demonstration = {
  id: "1",
  name: "Test Demonstration",
  description: "Test Description",
  effectiveDate: new Date("2025-01-01"),
  expirationDate: new Date("2025-12-31"),
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
  demonstrationStatus: activeDemonstrationStatus,
  state: california,
  users: [johnDoe],
};

export const mockAddDemonstrationInput: AddDemonstrationInput = {
  name: "New Demonstration",
  description: "New Description",
  effectiveDate: new Date("2025-01-01"),
  expirationDate: new Date("2025-12-31"),
  demonstrationStatusId: activeDemonstrationStatus.id,
  stateId: california.id,
  userIds: [johnDoe.id],
};

export const demonstrationMocks: MockedResponse[] = [
  {
    request: {
      query: GET_ALL_DEMONSTRATIONS_QUERY,
    },
    result: {
      data: { demonstrations: [testDemonstration] },
    },
  },

  {
    request: {
      query: GET_DEMONSTRATION_BY_ID_QUERY,
      variables: { id: testDemonstration.id },
    },
    result: {
      data: { demonstration: testDemonstration },
    },
  },

  {
    request: {
      query: ADD_DEMONSTRATION_QUERY,
      variables: { input: mockAddDemonstrationInput },
    },
    result: {
      data: { addDemonstration: testDemonstration },
    },
  },

  {
    request: {
      query: ADD_DEMONSTRATION_QUERY,
      variables: { input: { name: "bad add demonstration" } },
    },
    error: new Error("Failed to add demonstration"),
  },

  {
    request: {
      query: UPDATE_DEMONSTRATION_MUTATION,
      variables: {
        id: "1",
        input: {
          name: "Updated Demo Name",
          description: "Updated description",
          effectiveDate: new Date("2024-07-01T00:00:00.000Z"),
          expirationDate: new Date("2024-07-31T00:00:00.000Z"),
          demonstrationStatusId: "1",
          stateId: "1",
          userIds: ["1"],
        },
      },
    },
    result: {
      data: {
        updateDemonstration: {
          ...testDemonstration,
          name: "Updated Demo Name",
          description: "Updated description",
          effectiveDate: new Date("2024-07-01T00:00:00.000Z"),
          expirationDate: new Date("2024-07-31T00:00:00.000Z"),
          updatedAt: new Date("2024-07-01T00:00:00.000Z"),
        },
      },
    },
  },
  {
    request: {
      query: DEMONSTRATION_TABLE_QUERY,
    },
    result: {
      data: {
        demonstrations: [
          {
            id: "1",
            name: "Montana Medicaid Waiver",
            demonstrationStatus: { name: "Approved" },
            state: { name: "Montana" },
            projectOfficer: { fullName: "John Doe" },
            users: [{ id: "1" }],
            amendments: [
              {
                name: "Amendment 1 - Montana Medicaid Waiver",
                projectOfficer: { fullName: "John Doe" },
                amendmentStatus: { name: "Pending" },
              },
              {
                name: "Amendment 2 - Montana Medicaid Waiver",
                projectOfficer: { fullName: "John Doe" },
                amendmentStatus: { name: "Approved" },
              },
            ],
            extensions: [
              {
                name: "Extension 1 - Montana Medicaid Waiver",
                projectOfficer: { fullName: "John Doe" },
                extensionStatus: { name: "Active" },
              },
            ],
          },
          {
            id: "2",
            name: "Florida Health Innovation",
            demonstrationStatus: { name: "Expired" },
            state: { name: "Florida" },
            projectOfficer: { fullName: "Jane Smith" },
            users: [{ id: "2" }],
            amendments: [
              {
                name: "Amendment 1 - Florida Health Innovation",
                projectOfficer: { fullName: "Jane Smith" },
                amendmentStatus: { name: "Approved" },
              },
              {
                name: "Amendment 2 - Florida Health Innovation",
                projectOfficer: { fullName: "Jim Smith" },
                amendmentStatus: { name: "Pending" },
              },
              {
                name: "Amendment 3 - Florida Health Innovation",
                projectOfficer: { fullName: "Darth Smith" },
                amendmentStatus: { name: "Rejected" },
              },
            ],
            extensions: [],
          },
          {
            id: "3",
            name: "Texas Reform Initiative",
            demonstrationStatus: { name: "Withdrawn" },
            state: { name: "Texas" },
            projectOfficer: { fullName: "Bob Johnson" },
            users: [{ id: "1" }],
            amendments: [],
            extensions: [],
          },
          {
            id: "4",
            name: "New York Medicaid Expansion",
            demonstrationStatus: { name: "Approved" },
            state: { name: "New York" },
            projectOfficer: { fullName: "Alice Brown" },
            users: [{ id: "4" }],
            amendments: [
              {
                name: "Amendment 1 - New York Medicaid Expansion",
                projectOfficer: { fullName: "Alice Brown" },
                amendmentStatus: { name: "Pending" },
              },
              {
                name: "Amendment 2 - New York Medicaid Expansion",
                projectOfficer: { fullName: "Alice Brown" },
                amendmentStatus: { name: "Approved" },
              },
              {
                name: "Amendment 3 - New York Medicaid Expansion",
                projectOfficer: { fullName: "Alice Brown" },
                amendmentStatus: { name: "Rejected" },
              },
            ],
            extensions: [
              {
                name: "Extension 1 - New York Medicaid Expansion",
                projectOfficer: { fullName: "Alice Brown" },
                extensionStatus: { name: "Active" },
              },
              {
                name: "Extension 2 - New York Medicaid Expansion",
                projectOfficer: { fullName: "Alice Brown" },
                extensionStatus: { name: "Inactive" },
              },
            ],
          },
          {
            id: "5",
            name: "Illinois Care Coordination",
            demonstrationStatus: { name: "Expired" },
            state: { name: "Illinois" },
            projectOfficer: { fullName: "Carlos Rivera" },
            users: [{ id: "5" }],
            amendments: [
              {
                name: "Amendment 1 - Illinois Care Coordination",
                projectOfficer: { fullName: "Carlos Rivera" },
                amendmentStatus: { name: "Approved" },
              },
            ],
            extensions: [],
          },
          {
            id: "6",
            name: "Georgia Wellness Project",
            demonstrationStatus: { name: "Pending" },
            state: { name: "Georgia" },
            projectOfficer: { fullName: "Emily Clark" },
            users: [{ id: "6" }],
            amendments: [],
            extensions: [
              {
                name: "Extension 1 - Georgia Wellness Project",
                projectOfficer: { fullName: "Emily Clark" },
                extensionStatus: { name: "Active" },
              },
            ],
          },
          {
            id: "7",
            name: "Arizona Access Program",
            demonstrationStatus: { name: "Approved" },
            state: { name: "Arizona" },
            projectOfficer: { fullName: "Samantha Lee" },
            users: [{ id: "7" }],
            amendments: [
              {
                name: "Amendment 1 - Arizona Access Program",
                projectOfficer: { fullName: "Samantha Lee" },
                amendmentStatus: { name: "Approved" },
              },
              {
                name: "Amendment 2 - Arizona Access Program",
                projectOfficer: { fullName: "Samantha Lee" },
                amendmentStatus: { name: "Pending" },
              },
            ],
            extensions: [
              {
                name: "Extension 1 - Arizona Access Program",
                projectOfficer: { fullName: "Samantha Lee" },
                extensionStatus: { name: "Active" },
              },
            ],
          },
          {
            id: "8",
            name: "Ohio Health Forward",
            demonstrationStatus: { name: "Pending" },
            state: { name: "Ohio" },
            projectOfficer: { fullName: "Michael Chen" },
            users: [{ id: "8" }],
            amendments: [
              {
                name: "Amendment 1 - Ohio Health Forward",
                projectOfficer: { fullName: "Michael Chen" },
                amendmentStatus: { name: "Pending" },
              },
            ],
            extensions: [],
          },
          {
            id: "9",
            name: "Washington Wellness Initiative",
            demonstrationStatus: { name: "Expired" },
            state: { name: "Washington" },
            projectOfficer: { fullName: "Linda Park" },
            users: [{ id: "9" }],
            amendments: [],
            extensions: [
              {
                name: "Extension 1 - Washington Wellness Initiative",
                projectOfficer: { fullName: "Linda Park" },
                extensionStatus: { name: "Inactive" },
              },
            ],
          },
          {
            id: "10",
            name: "Colorado Coverage Expansion",
            demonstrationStatus: { name: "Withdrawn" },
            state: { name: "Colorado" },
            projectOfficer: { fullName: "David Kim" },
            users: [{ id: "10" }],
            amendments: [
              {
                name: "Amendment 1 - Colorado Coverage Expansion",
                projectOfficer: { fullName: "David Kim" },
                amendmentStatus: { name: "Rejected" },
              },
              {
                name: "Amendment 2 - Colorado Coverage Expansion",
                projectOfficer: { fullName: "David Kim" },
                amendmentStatus: { name: "Pending" },
              },
            ],
            extensions: [],
          },
          {
            id: "11",
            name: "Michigan Healthy Families",
            demonstrationStatus: { name: "Approved" },
            state: { name: "Michigan" },
            projectOfficer: { fullName: "Olivia Turner" },
            users: [{ id: "11" }],
            amendments: [
              {
                name: "Amendment 1 - Michigan Healthy Families",
                projectOfficer: { fullName: "Olivia Turner" },
                amendmentStatus: { name: "Approved" },
              },
              {
                name: "Amendment 2 - Michigan Healthy Families",
                projectOfficer: { fullName: "Olivia Turner" },
                amendmentStatus: { name: "Pending" },
              },
            ],
            extensions: [
              {
                name: "Extension 1 - Michigan Healthy Families",
                projectOfficer: { fullName: "Olivia Turner" },
                extensionStatus: { name: "Active" },
              },
            ],
          },
          {
            id: "12",
            name: "Pennsylvania Access Plus",
            demonstrationStatus: { name: "Pending" },
            state: { name: "Pennsylvania" },
            projectOfficer: { fullName: "Henry Adams" },
            users: [{ id: "12" }],
            amendments: [
              {
                name: "Amendment 1 - Pennsylvania Access Plus",
                projectOfficer: { fullName: "Henry Adams" },
                amendmentStatus: { name: "Pending" },
              },
            ],
            extensions: [],
          },
          {
            id: "13",
            name: "Oregon Health Plan",
            demonstrationStatus: { name: "Expired" },
            state: { name: "Oregon" },
            projectOfficer: { fullName: "Sophia Martinez" },
            users: [{ id: "13" }],
            amendments: [
              {
                name: "Amendment 1 - Oregon Health Plan",
                projectOfficer: { fullName: "Sophia Martinez" },
                amendmentStatus: { name: "Rejected" },
              },
              {
                name: "Amendment 2 - Oregon Health Plan",
                projectOfficer: { fullName: "Sophia Martinez" },
                amendmentStatus: { name: "Approved" },
              },
            ],
            extensions: [
              {
                name: "Extension 1 - Oregon Health Plan",
                projectOfficer: { fullName: "Sophia Martinez" },
                extensionStatus: { name: "Inactive" },
              },
            ],
          },
          {
            id: "14",
            name: "Virginia Medicaid Modernization",
            demonstrationStatus: { name: "Withdrawn" },
            state: { name: "Virginia" },
            projectOfficer: { fullName: "James Lee" },
            users: [{ id: "14" }],
            amendments: [],
            extensions: [],
          },
        ] satisfies DemonstrationTableItem[],
      },
    },
  },
];
