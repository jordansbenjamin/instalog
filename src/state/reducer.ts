import type { ParsedEntry, ParseResult, SubmissionResult } from "../types/shared";

type Step = 'paste' | 'preview' | 'submitting' | 'results';

interface State {
  step: Step;
  text: string;
  parsedResult: ParseResult | null;
  submissionResults: Record<string, SubmissionResult | 'pending'>;
}

type Action =
  | { type: "TEXT_CHANGED"; text: string}
  | { type: "PARSE_RESULT"; parsedResult: ParseResult}
  | { type: "EDIT_ENTRY"; index: number; patch: Partial<ParsedEntry>}
  | { type: "DELETE_ENTRY"; index: number}
  | { type: "BACK"; }
  | { type: "SUBMIT"; }
  | { type: "SUBMISSION_RESULT"; submissionResult: SubmissionResult}
  | { type: "RESET"; }

const initialState: State = {
  step: 'paste',
  text: '',
  parsedResult: null,
  submissionResults: {},
}
