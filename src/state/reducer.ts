import type { ParsedEntry, ParseResult, SubmissionResult } from "../types/shared";

type Step = 'paste' | 'preview' | 'submitting' | 'results';

export interface State {
  step: Step;
  text: string;
  parsedResult: ParseResult | null;
  submissionResults: SubmissionResult[];
}

export type Action =
  | { type: "TEXT_CHANGED"; text: string}
  | { type: "PARSE_RESULT"; parsedResult: ParseResult}
  | { type: "EDIT_ENTRY"; index: number; patch: Partial<ParsedEntry>}
  | { type: "DELETE_ENTRY"; index: number}
  | { type: "BACK"; }
  | { type: "SUBMIT_STARTED"; }
  | { type: "SUBMIT_ENDED"; }
  | { type: "SUBMISSION_RESULT"; index: number; submissionResult: SubmissionResult}
  | { type: "RETRY_SUBMISSION"; }
  | { type: "RESET"; }

export const initialState: State = {
  step: 'paste',
  text: '',
  parsedResult: null,
  submissionResults: [],
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
      return state.step === 'preview' ?  { ...state, step: 'paste', parsedResult: null } : state;
    case "SUBMIT_STARTED":
      return { ...state, step: 'submitting' };
    case "SUBMIT_ENDED":
      return { ...state, step: 'results' };
    case "SUBMISSION_RESULT": {
      const updatedResults = [...state.submissionResults];
      updatedResults[action.index] = action.submissionResult;
      return { ...state,  submissionResults: updatedResults};
    }
    case "RETRY_SUBMISSION":
      return { 
        ...state,
        submissionResults: state.submissionResults.filter(result => result.ok)
      };
    case "RESET":
      return initialState;
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}