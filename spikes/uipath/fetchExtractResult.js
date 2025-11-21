import axios from "axios";
export async function fetchExtractionResult(token, resultUrl) {
  const response = await axios.get(resultUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}
