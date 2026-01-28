import { duPost } from "./uipathClient.js";
import { getExtractorUrl } from "./getExtractorUrl.js";

export async function extractDoc(token, docId) {
  const asyncUrl = await getExtractorUrl(token);

  const extract = await duPost(asyncUrl, token, {
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
