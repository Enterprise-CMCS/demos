import { gql, useMutation, useQuery } from "@apollo/client";
import { PersonType } from "demos-server";

import { getCurrentUser } from "components/user/UserContext";
import { useToast } from "components/toast";
import { CommentBoxComment, CommentVisibility } from "./Comment";

type CommentQueryResult = {
  id: string;
  content: string;
  createdAt: string;
  authorUser: {
    person: {
      fullName: string;
    };
  };
};

export const GET_PUBLIC_COMMENTS_QUERY = gql`
  query GetPublicDeliverableComments($id: ID!) {
    deliverable(id: $id) {
      id
      publicComments {
        id
        content
        createdAt
        authorUser {
          person {
            fullName
          }
        }
      }
    }
  }
`;

export const GET_PRIVATE_COMMENTS_QUERY = gql`
  query GetPrivateDeliverableComments($id: ID!) {
    deliverable(id: $id) {
      id
      privateComments {
        id
        content
        createdAt
        authorUser {
          person {
            fullName
          }
        }
      }
    }
  }
`;

export const CREATE_PUBLIC_COMMENT_MUTATION = gql`
  mutation CreatePublicComment($deliverableId: ID!, $comment: NonEmptyString!) {
    createPublicComment(deliverableId: $deliverableId, comment: $comment) {
      id
      content
      createdAt
      authorUser {
        person {
          fullName
        }
      }
    }
  }
`;

export const CREATE_PRIVATE_COMMENT_MUTATION = gql`
  mutation CreatePrivateComment($deliverableId: ID!, $comment: NonEmptyString!) {
    createPrivateComment(deliverableId: $deliverableId, comment: $comment) {
      id
      content
      createdAt
      authorUser {
        person {
          fullName
        }
      }
    }
  }
`;

function toCommentBoxComment(
  c: CommentQueryResult,
  visibility: CommentVisibility
): CommentBoxComment {
  return {
    commentText: c.content,
    userFullName: c.authorUser.person.fullName,
    timestamp: new Date(c.createdAt),
    commentVisibility: visibility,
  };
}

export const useComments = (deliverableId: string, commentVisibility: CommentVisibility) => {
  const { currentUser } = getCurrentUser();
  const { showError } = useToast();

  const userPersonType: PersonType | undefined = currentUser?.person.personType;
  const isCmsOrAdminUser = userPersonType === "demos-cms-user" || userPersonType === "demos-admin";

  const { data: publicData, refetch: refetchPublic } = useQuery<{
    deliverable: { id: string; publicComments: CommentQueryResult[] };
  }>(GET_PUBLIC_COMMENTS_QUERY, {
    variables: { id: deliverableId },
    skip: !currentUser,
  });

  const { data: privateData, refetch: refetchPrivate } = useQuery<{
    deliverable: { id: string; privateComments: CommentQueryResult[] };
  }>(GET_PRIVATE_COMMENTS_QUERY, {
    variables: { id: deliverableId },
    skip: !currentUser || !isCmsOrAdminUser,
  });

  const [createPublicComment] = useMutation(CREATE_PUBLIC_COMMENT_MUTATION);
  const [createPrivateComment] = useMutation(CREATE_PRIVATE_COMMENT_MUTATION);

  const publicComments = (publicData?.deliverable.publicComments ?? []).map((c) =>
    toCommentBoxComment(c, "public")
  );
  const privateComments = (privateData?.deliverable.privateComments ?? []).map((c) =>
    toCommentBoxComment(c, "private")
  );
  const visibleComments = commentVisibility === "public" ? publicComments : privateComments;

  const addComment = async (commentText: string) => {
    try {
      if (commentVisibility === "public") {
        await createPublicComment({ variables: { deliverableId, comment: commentText } });
        refetchPublic();
      } else {
        await createPrivateComment({ variables: { deliverableId, comment: commentText } });
        refetchPrivate();
      }
    } catch {
      showError("Failed to add comment. Please try again.");
      throw new Error("Failed to add comment");
    }
  };

  return { isCmsOrAdminUser, visibleComments, addComment };
};
