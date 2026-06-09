import { MockedResponse } from "@apollo/client/testing";
import { GET_REFERENCES_QUERY } from "components/table/tables/ReferencesTable";
import { Reference } from "demos-server";
import {
  DOWNLOAD_REFERENCE_AGREEMENT_QUERY,
  DOWNLOAD_REFERENCE_QUERY,
} from "hooks/useDownloadReference";
import { MOCK_TAGS } from "./TagMocks";

export const mockReferences: Reference[] = [
  {
    id: "ref1",
    name: "Reference Document 1",
    description: "Description for Reference Document 1",
    agreement: {
      id: "agreement1",
      name: "Reference Agreement 1",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-02-01"),
    },
    demonstrationTypes: [MOCK_TAGS[0], MOCK_TAGS[1]],
    tags: [],
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-02-01"),
  },
  {
    id: "ref2",
    name: "Reference Document 2",
    description: "Description for Reference Document 2",
    agreement: null,
    demonstrationTypes: [MOCK_TAGS[3]],
    tags: [],
    createdAt: new Date("2024-01-02"),
    updatedAt: new Date("2024-02-02"),
  },
  {
    id: "ref3",
    name: "Reference Document 3",
    description: "Description for Reference Document 3",
    agreement: {
      id: "agreement2",
      name: "Reference Agreement 2",
      createdAt: new Date("2024-01-02"),
      updatedAt: new Date("2024-02-02"),
    },
    demonstrationTypes: [MOCK_TAGS[4]],
    tags: [],
    createdAt: new Date("2024-01-03"),
    updatedAt: new Date("2024-02-03"),
  },
];

export const referenceMocks: MockedResponse[] = [
  {
    request: {
      query: GET_REFERENCES_QUERY,
    },
    result: {
      data: {
        references: mockReferences,
      },
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
  },
  {
    request: {
      query: DOWNLOAD_REFERENCE_QUERY,
      variables: { id: "ref1", acceptedAgreementId: "agreement1" },
    },
    result: {
      data: {
        referenceDownloadUrl: "download-url-for-ref1",
      },
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
  },
  {
    request: {
      query: DOWNLOAD_REFERENCE_QUERY,
      variables: { id: "ref2" },
    },
    result: {
      data: {
        referenceDownloadUrl: "download-url-for-ref2",
      },
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
  },
  {
    request: {
      query: DOWNLOAD_REFERENCE_QUERY,
      variables: { id: "ref3", acceptedAgreementId: "agreement2" },
    },
    result: {
      data: {
        referenceDownloadUrl: "download-url-for-ref3",
      },
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
  },
  {
    request: {
      query: DOWNLOAD_REFERENCE_AGREEMENT_QUERY,
      variables: { id: "agreement1" },
    },
    result: {
      data: {
        referenceAgreementDownloadUrl: "download-url-for-agreement1",
      },
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
  },
  {
    request: {
      query: DOWNLOAD_REFERENCE_AGREEMENT_QUERY,
      variables: { id: "agreement2" },
    },
    result: {
      data: {
        referenceAgreementDownloadUrl: "download-url-for-agreement2",
      },
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
  },
];
