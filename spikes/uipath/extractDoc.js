import {
  duPost,
  UIPATH_BASE_URL,
  getExtractorGuid,
  getProjectId,
} from "./uipathClient.js";

export async function extractDoc(token, docId) {
  const extractorGuid = getExtractorGuid(); // NOTE: Zoe might make her own. So we may need to query here to get the right GUID
  const projectId = getProjectId();
  const url = `${UIPATH_BASE_URL}:443/${extractorGuid}/du_/api/framework/projects/${projectId}/extractors/generative_extractor/extraction/start`;

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
