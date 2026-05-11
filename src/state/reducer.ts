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

function reducer(state: State, action: Action): State {
  switch(action.type) {
    case "TEXT_CHANGED":
      return { ...state, text: state.text };
    case "PARSE_RESULT":
      return { ...state, parsedResult: state.parsedResult };
    case "EDIT_ENTRY":
      return { ...state, parsedResult: state.parsedResult };
    case "DELETE_ENTRY":
      return { ...state, parsedResult: state.parsedResult };
    case "BACK":
      return { ...state, parsedResult: state.parsedResult };
    case "SUBMIT":
      return { ...state, parsedResult: state.parsedResult };
    case "SUBMISSION_RESULT":
      return { ...state, parsedResult: state.parsedResult };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}