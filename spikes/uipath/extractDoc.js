import { duPost, getProjectId } from "./uipathClient.js";
import { getExtractorUrl } from "./getExtractorUrl.js";

export async function extractDoc(token, docId) {
  const asyncUrl = await getExtractorUrl(token);
  const projectId = getProjectId();
  const isDefaultProject = projectId.startsWith("000");
  const requestBody = {
    documentId: docId,
    pageRange: null,
    configuration: null,
    ...(isDefaultProject ? { prompts: activeQuestionBlobs } : {}),
  };

  const extract = await duPost(asyncUrl, token, requestBody);
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
