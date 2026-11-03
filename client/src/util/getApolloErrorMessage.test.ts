import { describe, expect, it } from "vitest";
import { getApolloErrorMessage } from "./getApolloErrorMessage";
import { ApolloError, ServerError } from "@apollo/client";

const BASE_SERVER_ERROR = {
  name: "ServerError",
  message: "this is the main error message",
  response: new Response(),
  statusCode: 403,
};

describe("getApolloErrorMessage", () => {
  it("should return empty string if error is undefined", () => {
    expect(getApolloErrorMessage(undefined)).toEqual("");
  });

  it("should return error.message if not a networkError", () => {

    const mockError = new ApolloError({
      errorMessage: "this is an error",
    });

    const message = getApolloErrorMessage(mockError);

    expect(message).toEqual("this is an error");
  });

  it("should return error.message if not an authorizer error", () => {

    const networkError: ServerError = Object.assign(new Error("unit test error"), {
      ...BASE_SERVER_ERROR,
      result: {
        key: "SOME_KEY",
      },
    });

    const mockError: ApolloError = new ApolloError({networkError, errorMessage: "main error message"});


    const message = getApolloErrorMessage(mockError);

    expect(message).toEqual("main error message");
  });

  it("should return the network error message", () => {
    const networkError: ServerError = Object.assign(new Error("unit test error"), {
      ...BASE_SERVER_ERROR,
      result: {
        code: "UNIT_TEST_ERROR",
        message: "this is the result error message",
      },
    });

    const mockError: ApolloError = new ApolloError({networkError, errorMessage: "main error message"});

    const message = getApolloErrorMessage(mockError);

    expect(message).toEqual("this is the result error message");
  });

});
