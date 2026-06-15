// jira-core — the PORTABLE OAuth + worklog layer. Pure functions, no Express, no
// DB, no process.env. The shell (Express now, Next route handlers later) supplies
// config + persistence and adapts these outputs to its transport.
export { createJiraCore } from "./createJiraCore";
export {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
} from "./pkce";
export { JiraCoreError, classifyStatus } from "./errors";
export type { JiraErrorKind } from "./errors";
export type {
  JiraCoreConfig,
  AtlassianTokens,
  AccessibleResource,
  WorklogInput,
  WorklogResult,
} from "./types";
