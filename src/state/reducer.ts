import type { ParseResult, SubmissionResult } from "../types/shared";

type Step = 'paste' | 'preview' | 'submitting' | 'results';

interface State {
  step: Step;
  rawInput: string;
  parsedResult: ParseResult | null;
  submissionResults: Record<string, SubmissionResult | 'pending'>;
}

const initialState: State = {
  step: 'paste',
  rawInput: '',
  parsedResult: null,
  submissionResults: {},
}