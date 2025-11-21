import axios from "axios";

export async function extractDoc(token, docId) {
  const extract = await axios.post(
    `https://govcloud.uipath.us:443/${process.env.EXTRACTOR_GUID}/du_/api/framework/projects/${process.env.ZERO_PROJECT_ID}/extractors/generative_extractor/extraction/start?api-version=1.0`,
    {
      documentId: docId,
      pageRange: null,
      prompts: [
        {
          id: "State",
          question: "What state is this 1115 waver for?",
          fieldType: "Text",
          multiValued: false,
        },
      ],
      configuration: null,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return extract.data.resultUrl;
}