import React from "react";
import { gql, TypedDocumentNode, useQuery } from "@apollo/client";
import {
  Document as ServerDocument,
  Demonstration as ServerDemonstration,
  Extension as ServerExtension,
  Amendment as ServerAmendment,
  User as ServerUser,
  Person as ServerPerson,
} from "demos-server";
import { useParams } from "react-router-dom";
import { formatDate } from "util/formatDate";
import { tw } from "tags/tw";
import { DocumentPreview } from "./DocumentPreview";

type Person = Pick<ServerPerson, "id" | "fullName">;
type User = Pick<ServerUser, "id"> & {
  person: Person;
};
type Demonstration = Pick<ServerDemonstration, "id" | "name"> & { __typename: "Demonstration" };
type Amendment = Pick<ServerAmendment, "id" | "name"> & {
  demonstration: Demonstration;
  __typename: "Amendment";
};
type Extension = Pick<ServerExtension, "id" | "name"> & {
  demonstration: Demonstration;
  __typename: "Extension";
};
type Document = Pick<ServerDocument, "id" | "name" | "createdAt" | "presignedDownloadUrl"> & {
  application: Demonstration | Amendment | Extension;
  owner: User;
};

export const DOCUMENT_DETAIL_QUERY: TypedDocumentNode<{ document: Document }, { id: string }> = gql`
  query DocumentDetail($id: ID!) {
    document(id: $id) {
      id
      name
      presignedDownloadUrl
      application {
        ... on Demonstration {
          id
          name
        }
        ... on Extension {
          id
          name
          demonstration {
            id
            name
          }
        }
        ... on Amendment {
          id
          name
          demonstration {
            id
            name
          }
        }
      }
      createdAt
      owner {
        id
        person {
          id
          fullName
        }
      }
    }
  }
`;

export const ApplicationLink = ({
  application,
}: {
  application: Demonstration | Amendment | Extension;
}) => {
  const linkStyles = tw`text-lg text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded`;

  let anchorText;
  let anchorHref;
  switch (application.__typename) {
    case "Amendment":
      anchorText = `${application.demonstration.name} - Amendment: ${application.name}`;
      anchorHref = `/demonstrations/${application.demonstration.id}?amendment=${application.id}`;
      break;
    case "Extension":
      anchorText = `${application.demonstration.name} - Extension: ${application.name}`;
      anchorHref = `/demonstrations/${application.demonstration.id}?extension=${application.id}`;
      break;
    default:
      anchorText = application.name;
      anchorHref = `/demonstrations/${application.id}`;
      break;
  }
  return (
    <a className={linkStyles} href={anchorHref}>
      {anchorText}
    </a>
  );
};

export const DocumentDetail: React.FC<{ documentId: string }> = ({ documentId }) => {
  const { loading, error, data } = useQuery(DOCUMENT_DETAIL_QUERY, {
    variables: { id: documentId },
    fetchPolicy: "network-only",
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data || !data.document) return <div>Document not found.</div>;

  const { document } = data;

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col gap-1 border-b-1 pb-2">
        <h1 className="text-[20px] font-bold text-brand uppercase">{document.name}</h1>
        <ApplicationLink application={document.application} />
        <p>
          <span className="font-bold">Uploader:</span> {document.owner.person.fullName}
        </p>
        <p>
          <span className="font-bold">Uploaded on:</span> {formatDate(document.createdAt)}
        </p>
      </div>
      <div className="mt-2 flex-1 min-h-0">
        <DocumentPreview
          presignedDownloadUrl={document.presignedDownloadUrl}
          filename={document.name}
        />
      </div>
    </div>
  );
};

export const DocumentDetailPage: React.FC = () => {
  const { id: documentId } = useParams<{ id: string }>();

  if (!documentId) {
    return <div>Document ID is required.</div>;
  }
  return (
    <div className="h-screen flex flex-col">
      <div className="flex flex-1 overflow-hidden bg-gray-primary-layout min-h-0">
        <div className="flex-1 overflow-auto min-h-0">
          <div className="p-[16px] h-full">
            <div className="shadow-md bg-white p-[16px] h-full">
              {documentId ? (
                <DocumentDetail documentId={documentId} />
              ) : (
                <div>Document ID is required.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
