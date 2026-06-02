import { MockedResponse } from "@apollo/client/testing";
import { GET_REFERENCES_QUERY, Reference } from "components/table/tables/ReferencesTable";
import {
  DOWNLOAD_REFERENCE_AGREEMENT_QUERY,
  DOWNLOAD_REFERENCE_QUERY,
} from "hooks/useDownloadReference";

export const mockReferences: Reference[] = [
  {
    id: "ref1",
    name: "Reference Document 1",
    description: "Description for Reference Document 1",
    agreement: {
      id: "agreement1",
      name: "Reference Agreement 1",
      createdAt: "2024-01-01",
    },
    demonstrationTypes: ["Type A", "Type B"],
    updatedAt: "2024-01-01",
  },
  {
    id: "ref2",
    name: "Reference Document 2",
    description: "Description for Reference Document 2",
    agreement: null,
    demonstrationTypes: ["Type C"],
    updatedAt: "2024-01-04",
  },
  {
    id: "ref3",
    name: "Reference Document 3",
    description: "Description for Reference Document 3",
    agreement: {
      id: "agreement2",
      name: "Reference Agreement 2",
      createdAt: "2024-01-02",
    },
    demonstrationTypes: ["Type B"],
    updatedAt: "2024-01-03",
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
