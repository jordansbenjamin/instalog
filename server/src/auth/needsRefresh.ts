// Proactive-refresh policy for the ~1h Atlassian access token.
//
// We refresh a little BEFORE the token actually expires. The skew buffer covers
// two real risks: (1) clock drift between our server and Atlassian, and (2) the
// time a request takes — a token that's valid when /worklog starts could expire
// mid-flight against Jira. Refreshing early avoids a guaranteed-avoidable 401.
export const ACCESS_TOKEN_REFRESH_SKEW_MS = 60_000; // 1 minute

/**
 * Should we refresh the access token before using it?
 *
 * LEARNING CHECKPOINT — your implementation (~1-3 lines).
 * Contract (pinned by needsRefresh.test.ts):
 *   - `accessExpiresAt` is the absolute expiry (epoch ms) we persisted.
 *   - `now` is the current time (epoch ms), injected so this stays testable.
 *   - Return true once we are within ACCESS_TOKEN_REFRESH_SKEW_MS of expiry
 *     (and of course if already past it); false while the token is comfortably valid.
 *
 * Think about: the comparison direction, and whether the exact boundary
 * (now === accessExpiresAt - skew) should count as "refresh" (the tests say it does).
 */
export function needsRefresh(accessExpiresAt: number, now: number): boolean {
  // Refresh once we reach the point one skew-buffer before expiry (or later).
  return now >= accessExpiresAt - ACCESS_TOKEN_REFRESH_SKEW_MS;
}
