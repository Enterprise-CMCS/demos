import { useSearchParams } from "react-router-dom";

export const TYPE_TAG_SEARCH_PARAM = "typeTag";

// Held in the URL so a browser refresh reopens the same associated records view.
export const useSelectedTypeTag = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTypeTag = searchParams.get(TYPE_TAG_SEARCH_PARAM) ?? "";

  // Passing "" clears the selection and returns to the Type/Tag list.
  const selectTypeTag = (tagName: string) => {
    setSearchParams((params) => {
      if (tagName) {
        params.set(TYPE_TAG_SEARCH_PARAM, tagName);
      } else {
        params.delete(TYPE_TAG_SEARCH_PARAM);
      }
      return params;
    });
  };

  return { selectedTypeTag, selectTypeTag };
};
