import {
  duPost,
  UIPATH_BASE_URL,
  UIPATH_EXTRACTOR_GUID,
  UIPATH_PROJECT_ID,
} from "./uipathClient.js";

export async function extractDoc(token, docId) {
  const url = `${UIPATH_BASE_URL}:443/${UIPATH_EXTRACTOR_GUID}/du_/api/framework/projects/${UIPATH_PROJECT_ID}/extractors/generative_extractor/extraction/start`;

  const extract = await duPost(url, token, {
    documentId: docId,
    pageRange: null,
    prompts: activeQuestionBlobs,
    configuration: null,
  });
  return extract.data.resultUrl;
}

const activeQuestionBlobs = [
  {
    id: "State",
    question: "What state is this 1115 waver for?",
    fieldType: "Text",
    multiValued: false,
  },
];
