// The failure taxonomy for jira-core. Mirrors the frontend's SubmissionErrorKind
// (src/types/shared.ts) but is defined independently — the portable core must not
// import from the SPA. The route layer maps these kinds onto HTTP / SubmissionResult.
export type JiraErrorKind =
  | "auth" // 401: access token rejected
  | "permission" // 403: not allowed on this resource
  | "not-found" // 404: issue/resource missing
  | "server" // 5xx: Atlassian's problem
  | "network" // fetch threw: connectivity issue
  | "invalid-grant" // token endpoint rejected the code/refresh token → reconnect
  | "invalid-response" // 2xx but the body was missing/!shaped as expected
  | "unknown"; // anything else

export class JiraCoreError extends Error {
  readonly kind: JiraErrorKind;
  readonly status?: number;

  constructor(kind: JiraErrorKind, message: string, status?: number) {
    super(message);
    this.name = "JiraCoreError";
    this.kind = kind;
    this.status = status;
  }
}

/** Map an HTTP status from a Jira/Atlassian API response onto an error kind. */
export function classifyStatus(status: number): JiraErrorKind {
  if (status === 401) return "auth";
  if (status === 403) return "permission";
  if (status === 404) return "not-found";
  if (status >= 500) return "server";
  return "unknown";
}
