// jira-core — the PORTABLE OAuth + worklog layer. Pure functions, no Express, no
// DB, no process.env. The shell (Express now, Next route handlers later) supplies
// config + persistence and adapts these outputs to its transport.
export { createJiraCore } from "./createJiraCore.js";
export {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
} from "./pkce.js";
export { JiraCoreError, classifyStatus } from "./errors.js";
export type { JiraErrorKind } from "./errors.js";
export type {
  JiraCore,
  JiraCoreConfig,
  AtlassianTokens,
  AccessibleResource,
  CurrentUser,
  WorklogInput,
  WorklogResult,
} from "./types.js";
