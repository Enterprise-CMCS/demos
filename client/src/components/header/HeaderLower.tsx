import { useQuery } from "@apollo/client";
import { SecondaryButton } from "components/button/SecondaryButton";
import { AddIcon } from "components/icons/AddIcon";
import { gql } from "graphql-tag";
import React from "react";

export const HEADER_LOWER_QUERY = gql`
  query HeaderLowerQuery($id: ID!) {
    user(id: $id) {
      fullName
    } 
  }
`;

const HeaderLower: React.FC<{ userId?: number }> = ({ userId }) => {
  if (!userId) {
    return (
      <div className="w-full bg-blue-900 text-white px-4 py-1 flex items-center justify-between"/>
    );
  }

  const { data, error, loading } = useQuery(HEADER_LOWER_QUERY, {
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

  return (
    <div className="w-full bg-[var(--color-brand)] text-white px-4 py-1 flex items-center justify-between">
      <div>
        <span className="font-bold block">Hello {user.fullName}</span>
        <span className="block text-sm">Welcome to DEMOS!</span>
      </div>
      <div>
        <SecondaryButton size="small" className="cursor-pointer flex items-center gap-1 px-1 py-1">
          <span className="">Create New</span>
          <AddIcon/>
        </SecondaryButton>
      </div>
    </div>
  );
};

export default HeaderLower;
