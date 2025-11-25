import { duPost, UIPATH_BASE_URL, getExtractorGuid, getProjectId } from "./uipathClient";

export interface ExtractionStartResponse {
  resultUrl: string;
}

export interface ExtractionPrompt {
  id: string;
  question: string;
  fieldType: string;
  multiValued: boolean;
}

export async function extractDoc(token: string, docId: string): Promise<string> {
  const extractorGuid = getExtractorGuid(); // NOTE: Zoe might make her own. So we may need to query here to get the right GUID
  const projectId = getProjectId();
  const url = `${UIPATH_BASE_URL}:443/${extractorGuid}/du_/api/framework/projects/${projectId}/extractors/generative_extractor/extraction/start`;

  const extract = await duPost<ExtractionStartResponse>(url, token, {
    documentId: docId,
    pageRange: null,
    prompts: activeQuestionBlobs,
    configuration: null,
  });

  const resultUrl = extract.data.resultUrl;
  if (!resultUrl) {
    throw new Error("UiPath extraction did not return a resultUrl.");
  }
  return resultUrl;
}

const activeQuestionBlobs: ExtractionPrompt[] = [
  {
    id: "State",
    question: "What state is this 1115 waver for?",
    fieldType: "Text",
    multiValued: false,
  },
];
