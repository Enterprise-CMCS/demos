import { MockedResponse } from "@apollo/client/testing";
import { GET_ALL_STATES_QUERY } from "hooks/useStates";

export const california = {
  id: "1",
  stateCode: "CA",
  stateName: "California",
  users: [],
  demonstrations: [],
};

export const stateMocks: MockedResponse[] = [
  {
    request: {
      query: GET_ALL_STATES_QUERY,
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
