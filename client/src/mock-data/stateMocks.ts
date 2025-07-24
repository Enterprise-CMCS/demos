import { MockedResponse } from "@apollo/client/testing";
import { states } from "data/StatesAndTerritories";
import { State } from "demos-server";
import { STATE_OPTIONS_QUERY } from "queries/stateQueries";

export const california: State = {
  id: "1",
  stateCode: "CA",
  stateName: "California",
};

export const stateMocks: MockedResponse[] = [
  {
    request: {
      query: STATE_OPTIONS_QUERY,
    },
    result: {
      data: {
        states: states.map((state) => ({
          stateCode: state.abbrev,
          stateName: state.name,
        })),
      },
    },
  },
];
