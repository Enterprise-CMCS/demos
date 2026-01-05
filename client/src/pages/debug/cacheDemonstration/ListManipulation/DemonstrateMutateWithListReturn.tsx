import { gql, useMutation } from "@apollo/client";
import { Button } from "components/button";
import React from "react";
import { Amendment as ServerAmendment } from "demos-server";
import { getTime } from "date-fns";

const ADD_AMENDMENT_QUERY = gql`
  mutation addAmendment($input: CreateAmendmentInput!) {
    createAmendment(input: $input) {
      id
      name
      demonstration {
        id
        amendments {
          id
          name
        }
      }
    }
  }
`;

type Amendment = Pick<ServerAmendment, "id" | "name">;

export const DemonstrateMutateWithListReturn: React.FC<{ demonstrationId: string }> = ({
  demonstrationId,
}) => {
  const [addAmendment, { data: addAmendmentData }] = useMutation<{
    createAmendment: Amendment & {
      demonstration: {
        id: string;
        amendments: Amendment[];
      };
    };
  }>(ADD_AMENDMENT_QUERY);

  const handleAddAmendment = () => {
    addAmendment({
      variables: {
        input: {
          demonstrationId: demonstrationId,
          name: `Name at timestamp: ${getTime(new Date())}`,
          description: "This amendment was added via the List Manipulation Demo",
        },
      },
    });
  };
  return (
    <div>
      <p>
        Here, I have created a new add amendment mutation to return the parent demonstration with
        its list of amendments instead of the amendment. Because in this demo I dont want to modify
        the server, this can be achieved by fetching the amendment, its demonstration, and that
        demonstrations amendments. Because the list of amendments is part of the demonstration
        object, Apollo is able to reconcile the data and update the list automatically.
      </p>
      <Button
        name="button-add-amendment-with-parent-return"
        onClick={() => {
          handleAddAmendment();
        }}
      >
        Add Amendment (with parent return)
      </Button>
      <div>
        <p className="font-semibold">Last Added Amendment:</p>
        <div className="ml-1">
          <p>
            Amendment ID:{" "}
            <span className="font-semibold"> {addAmendmentData?.createAmendment.id}</span>
          </p>
          <p>
            Amendment Name:{" "}
            <span className="font-semibold"> {addAmendmentData?.createAmendment.name}</span>
          </p>
        </div>
      </div>

      <p>
        Notice, currently im returning the newly added amendments data for use of display here,
        however we largely dont care about the added amendments, we just want to see it among the
        other amendments. This means the useMutation hook doesnt actually need to return any data
        (beyond loading state and error handling, which is ignored for this demonstration). Largely,
        we are moving towards retuning the demonstration object from our server&apos;s mutations
        anyway, so this pattern will be even simpler with newer resolvers.
      </p>
      <p>
        We dont even need to return the name field from the mutation; just the ID will suffice.
        Apollo will see a list of returned amendment Ids attached to the demonstration, and know
        that the data is insufficiant for what the main table query requires (the data it now has
        violates the data contract), so it will automatically refetch it. Try trimming down what is
        returned from the mutation to just the ID field in the list of amendments and see how it
        still works.
      </p>
    </div>
  );
};
