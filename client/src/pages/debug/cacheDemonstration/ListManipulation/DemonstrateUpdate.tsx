import { gql, useMutation } from "@apollo/client";
import { Button } from "components/button";
import { getTime } from "date-fns";
import React from "react";
import { Amendment as ServerAmendment } from "demos-server";

type Amendment = Pick<ServerAmendment, "id" | "name">;

const UPDATE_AMENDMENT_NAME = gql`
  mutation updateAmendmentName($id: ID!, $input: UpdateAmendmentInput!) {
    updateAmendment(id: $id, input: $input) {
      id
      name
    }
  }
`;

export const DemonstrateUpdate: React.FC<{ amendments: Amendment[] }> = ({ amendments }) => {
  const [updateAmendmentName, { data: updateMutationData }] = useMutation<{
    updateAmendment: Amendment;
  }>(UPDATE_AMENDMENT_NAME);

  const handleUpdateRandomAmendmentName = () => {
    if (!amendments || amendments.length === 0) {
      return;
    }
    const randomIndex = Math.floor(Math.random() * amendments.length);
    const amendmentToUpdate = amendments[randomIndex];

    updateAmendmentName({
      variables: {
        id: amendmentToUpdate.id,
        input: {
          name: `Updated Name at timestamp: ${getTime(new Date())}`,
        },
      },
    });
  };

  return (
    <div>
      <Button
        name="button-update-amendment-name"
        onClick={() => {
          handleUpdateRandomAmendmentName();
        }}
      >
        Update a random Amendment&apos;s Name
      </Button>
      <div>
        <p className="font-semibold">Last Updated Amendment:</p>
        <div className="ml-1">
          <p>
            Amendment ID:{" "}
            <span className="font-semibold"> {updateMutationData?.updateAmendment.id}</span>
          </p>
          <p>
            Amendment Name:{" "}
            <span className="font-semibold"> {updateMutationData?.updateAmendment.name}</span>
          </p>
        </div>
      </div>
    </div>
  );
};
