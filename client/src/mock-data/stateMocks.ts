import { MockedResponse } from "@apollo/client/testing";
import { GET_STATES_FOR_SELECT } from "pages/Demonstrations/DemonstrationColumns";

export const california = {
  id: "1",
  stateCode: "CA",
  stateName: "California",
};

export const stateMocks: MockedResponse[] = [
  {
    request: {
      query: GET_STATES_FOR_SELECT,
    },
    result: {
      data: {
        states: [
          {
            stateCode: "NC",
            stateName: "North Carolina",
          },
          {
            stateCode: "CA",
            stateName: "California",
          },
          {
            stateCode: "TX",
            stateName: "Texas",
          },
          {
            stateCode: "FL",
            stateName: "Florida",
          },
          {
            stateCode: "NY",
            stateName: "New York",
          },
          {
            stateCode: "WA",
            stateName: "Washington",
          },
          {
            stateCode: "IL",
            stateName: "Illinois",
          },
          {
            stateCode: "PA",
            stateName: "Pennsylvania",
          },
          {
            stateCode: "OH",
            stateName: "Ohio",
          },
        ],
      },
    },
  },
];
