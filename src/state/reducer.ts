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

export function reducer(state: State, action: Action): State {
  switch(action.type) {
    case "TEXT_CHANGED":
      return { ...state, text: action.text };
    case "PARSE_RESULT":
      return { ...state, step: 'preview', parsedResult: action.parsedResult };
    case "EDIT_ENTRY":
      if (!state.parsedResult || !state.parsedResult.success) return state;
      return {
        ...state,
        parsedResult: {
          ...state.parsedResult,
          entries: state.parsedResult.entries.map((entry: ParsedEntry, index: number) => index === action.index ? {...entry, ...action.patch} : entry),
        }
      };
    case "DELETE_ENTRY":
      if (!state.parsedResult || !state.parsedResult.success) return state;
      return { 
        ...state, 
        parsedResult: {
          ...state.parsedResult,
          entries: state.parsedResult.entries.filter((_, index) => index !== action.index),
        }
      };
    case "BACK":
      return { ...state, step: 'paste', parsedResult: null };
    case "SUBMIT":
      return { ...state, step: 'submitting' };
    case "SUBMISSION_RESULT":
      return { ...state, parsedResult: state.parsedResult };
    case "RESET":
      return initialState;
    default:
      const _exhaustive: never = action;
      return _exhaustive;
  }
}