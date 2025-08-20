import React, { useState } from "react";

import { ChevronDownIcon } from "components/icons";
import { normalizeUserId } from "hooks/user/uuidHelpers";

import { gql, useQuery } from "@apollo/client";

import { Avatar } from "./Avatar";
import { Button } from "components/button";

export const PROFILE_BLOCK_QUERY = gql`
  query ProfileBlockQuery($id: ID!) {
    user(id: $id) {
      fullName
    }
  }
`;

export const ProfileBlock: React.FC<{ userId?: string }> = ({ userId }) => {
  const [open, setOpen] = useState(false);

  if (!userId) {
    return (
      <div>
        <Button name="button-log-in" onClick={() => {}}>
          Log In
        </Button>
      </div>
    );
  }

  const { data, error, loading } = useQuery(PROFILE_BLOCK_QUERY, {
    variables: { id: normalizeUserId(userId) },
  });

  if (error) {
    return <div>Error: {error.message}</div>;
  }
  if (loading) {
    return <div>Loading...</div>;
  }
  if (!data || !data.user) {
    return null;
  }

  const user = data.user;
  const firstCharacter = user.fullName.charAt(0).toUpperCase();

  return (
    <div
      id="profile-container"
      className="relative flex items-center gap-x-1 mr-2 cursor-pointer"
      onClick={() => setOpen(!open)}
    >
      <Avatar character={firstCharacter} />
      <span id="profile-name" className="text-lg font-semibold">
        {user.fullName}
      </span>
      <span>
        <ChevronDownIcon className={open ? "rotate-180" : ""} />
      </span>
      {open && (
        <ul
          id="user-actions"
          className="absolute top-12 min-w-full right-0 bg-white border border-gray-300 rounded shadow-lg z-11"
        >
          <li className="hover:bg-gray-100 cursor-pointer p-1">
            <a>Logout</a>
          </li>
          <li className="hover:bg-gray-100 cursor-pointer p-1">
            <a>View Roles</a>
          </li>
        </ul>
      )}
    </div>
  );
};
