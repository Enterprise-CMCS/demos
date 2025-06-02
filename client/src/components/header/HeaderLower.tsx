import { useQuery } from "@apollo/client";
import { gql } from "graphql-tag";
import React from "react";

const HEADER_LOWER_QUERY = gql`
  query HeaderLowerQuery($id: ID!) {
    user(id: $id) {
      fullName
    } 
  }
`;
const HeaderLower: React.FC<{ userId?: number }> = (userId) => {
  if (!userId) {
    return (
      <div>
        <button>Log In</button>
      </div>
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

  const fullName  = data.user.fullName;

  return (
    <div className="w-full bg-blue-900 text-white p-1 pl-4">
      <span className="font-bold">Hello {fullName}</span>
      <span className="ml-2">Welcome to DEMOS!</span>
    </div>
  );
};

export default HeaderLower;
