import axios from "axios";

export async function extractDoc(token, docId) {
  const baseUrl = "https://govcloud.uipath.us:443";
  const extractorGuid = process.env.EXTRACTOR_GUID;
  const projectId = process.env.ZERO_PROJECT_ID;
  const apiVersion = "1.0";
  const appBaseUrl = `${baseUrl}/${extractorGuid}/du_/api/framework/projects/${projectId}`;
  const urlWithEndpoint = `${appBaseUrl}/extractors/generative_extractor/extraction/start`;

  const extract = await axios.post(
    urlWithEndpoint,
    {
      documentId: docId,
      pageRange: null,
      prompts: activeQuestionBlobs,
      configuration: null,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        "api-version": apiVersion,
      },
    }
  );
  return extract.data.resultUrl;
}

const activeQuestionBlobs =
  [
    {
      id: "State",
      question: "What state is this 1115 waver for?",
      fieldType: "Text",
      multiValued: false,
    },
  ];

