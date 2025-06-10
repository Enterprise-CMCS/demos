import { gql, useQuery } from "@apollo/client";
import React, { useState } from "react";
import { Avatar } from "./Avatar";
import { ChevronDown } from "components/icons";

export const PROFILE_BLOCK_QUERY = gql`
  query ProfileBlockQuery($id: ID!) {
    user(id: $id) {
      fullName
    }
  }
`;

export const ProfileBlock: React.FC<{ userId?: number }> = ({ userId }) => {
  const [open, setOpen] = useState(false);

  if (!userId) {
    return (
      <div>
        <button>Log In</button>
      </div>
    );
  }

  const { data, error, loading } = useQuery(PROFILE_BLOCK_QUERY, {
    variables: { id: userId },
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
        <ChevronDown className={open ? "rotate-180" : ""} />
      </span>
      {open && (
        <ul
          id="user-actions"
          className="absolute top-12 min-w-full right-0 bg-white border border-gray-300 rounded shadow-lg"
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
