import { MockedResponse } from "@apollo/client/testing";
import { states } from "data/StatesAndTerritories";
import { State } from "demos-server";
import { StateOption } from "hooks/useState";
import { STATE_OPTIONS_QUERY } from "queries/stateQueries";

export const california: State = {
  id: "CA",
  name: "California",
};

export const stateOptions: Pick<State, "name" | "id">[] = states.map((state) => ({
  name: state.name,
  id: state.abbrev,
}));

export const stateMocks: MockedResponse[] = [
  {
    request: {
      query: STATE_OPTIONS_QUERY,
    },
    result: {
      data: {
        states: states.map((state) => ({
          id: state.abbrev,
          name: state.name,
        })) satisfies StateOption[],
      },
    },
  },
];
