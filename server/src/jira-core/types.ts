// Public types for jira-core. Self-contained: nothing here imports from the SPA,
// so the whole directory copies verbatim into the future Next.js app.

/** Bound once via createJiraCore(); the env boundary stays in the shell. */
export interface JiraCoreConfig {
  readonly clientId: string;
  readonly clientSecret: string;
  readonly redirectUri: string;
  readonly scopes: readonly string[];
}

/**
 * Normalised tokens from Atlassian. `expiresInSeconds` is the raw `expires_in`
 * from the token response — core stays clock-free; the store/route stamps the
 * absolute expiry with its own clock.
 */
export interface AtlassianTokens {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly scope: string;
  readonly expiresInSeconds: number;
}

/** A Jira site the user granted access to. `cloudId` keys every Jira API call. */
export interface AccessibleResource {
  readonly cloudId: string;
  readonly url: string;
  readonly name: string;
  readonly scopes: readonly string[];
}

/** A worklog to post. `body` is the ADF payload; core passes it through opaquely. */
export interface WorklogInput {
  readonly ticketId: string;
  readonly body: unknown;
}

export interface WorklogResult {
  readonly worklogId: string;
}
