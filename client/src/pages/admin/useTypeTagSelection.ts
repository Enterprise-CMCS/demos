import { useSearchParams } from "react-router-dom";

export const TYPE_TAG_SEARCH_PARAM = "typeTag";

// The selection lives in the URL so a browser refresh reopens the same associated records view.
export const getSelectedTypeTag = (searchParams: URLSearchParams): string =>
  searchParams.get(TYPE_TAG_SEARCH_PARAM) ?? "";

export const isTypeTagSelected = (searchParams: URLSearchParams): boolean =>
  getSelectedTypeTag(searchParams) !== "";

export const useTypeTagSelection = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Replacing the history entry keeps Close Admin's navigate(-1) one step from leaving Admin.
  const selectTypeTag = (tagName: string) => {
    setSearchParams(
      (params) => {
        if (tagName) {
          params.set(TYPE_TAG_SEARCH_PARAM, tagName);
        } else {
          params.delete(TYPE_TAG_SEARCH_PARAM);
        }
        return params;
      },
      { replace: true }
    );
  };

  return {
    selectedTypeTag: getSelectedTypeTag(searchParams),
    selectTypeTag,
    clearSelectedTypeTag: () => selectTypeTag(""),
  };
};
