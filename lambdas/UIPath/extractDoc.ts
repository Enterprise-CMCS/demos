import { duPost,
  getExtractorGuid,
  UIPATH_EXTRACTOR_NAME,
  getProjectId
} from "./uipathClient";

export interface ExtractionStartResponse {
  resultUrl: string;
}

export interface ExtractionPrompt {
  id: string;
  question: string;
  fieldType: string;
  multiValued: boolean;
}

export async function extractDoc(
  token: string,
  docId: string,
  prompts: ExtractionPrompt[]
): Promise<string> {
  if (!prompts?.length) {
    throw new Error("No document understanding prompts configured.");
  }

  const extractorGuid = await getExtractorGuid(); // NOTE: Zoe might make her own. So we may need to query here to get the right GUID
  const projectId = getProjectId();
  const url = `https://govcloud.uipath.us/${extractorGuid}/du_/api/framework/projects/${projectId}/extractors/${UIPATH_EXTRACTOR_NAME}/extraction/start?api-version=1.0`;

  const extract = await duPost<ExtractionStartResponse>(url, token, {
    documentId: docId,
    pageRange: null,
    prompts,
    configuration: null,
  });

  const resultUrl = extract.data.resultUrl;
  if (!resultUrl) {
    throw new Error("UiPath extraction did not return a resultUrl.");
  }
  return resultUrl;
}
