import { DateType, DocumentType } from "../constants";

export type DocumentInput = {
  name: string;
  description: string;
  documentContentText: string;
};

export type DocumentsInput<TDocumentType extends DocumentType = DocumentType> = Record<
  TDocumentType,
  DocumentInput
>;

export type DatesInput<TDateType extends DateType = DateType> = Record<TDateType, Date>;
