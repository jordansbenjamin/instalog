import type { JiraAdapter } from "./JiraAdapter";
import { postWorklog } from "../jiraClient";

// Thin wrapper over the existing typed Jira client and its error taxonomy. The
// signal is part of the interface for symmetry with the fake adapter, but
// postWorklog doesn't yet thread it to fetch — so an aborted submission is
// discarded by the orchestration loop rather than cancelled in-flight. Threading
// the signal through postWorklog is a small future enhancement.
export const realJiraAdapter: JiraAdapter = {
  submit(worklog) {
    return postWorklog(worklog);
  },
};
