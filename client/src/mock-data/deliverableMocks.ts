type MockDeliverable = {
  id: string;
  name: string;
  demonstrationName: string;
  deliverableType: string;
  dueDate: string;
  status: string;
  state: {
    id: string;
  };
  primaryContact?: {
    id: string;
    fullName: string;
  };
};

export const MOCK_DELIVERABLES: MockDeliverable[] = [
  {
    id: "1",
    name: "Deliverable 1",
    demonstrationName: "Demonstration A",
    deliverableType: "Report",
    dueDate: "2024-07-01",
    status: "Overdue",
    state: {
      id: "CA",
    },
  },
  {
    id: "2",
    name: "Deliverable 2",
    demonstrationName: "Demonstration B",
    deliverableType: "Presentation",
    dueDate: "2024-08-15",
    status: "Approved",
    primaryContact: {
      id: "currentUserId",
      fullName: "Current User",
    },
    state: {
      id: "NY",
    },
  },
  {
    id: "3",
    name: "Deliverable 3",
    demonstrationName: "Demonstration C",
    deliverableType: "Data Set",
    dueDate: "2024-09-30",
    status: "Upcoming",
    state: {
      id: "TX",
    },
  },
];
