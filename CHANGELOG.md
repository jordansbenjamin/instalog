# Changelog

Meaningful changes to instalog are recorded here when they become part of a
milestone release. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the version
numbers follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.6.0] - 2026-07-24

### Added

- A separate common-ticket reference beside the worklog wizard.
- Personal browser-local ticket management with add, edit, delete, search,
  copy, and manual priority ordering.
- Spreadsheet, CSV, and Markdown-link imports with a preview for new, updated,
  unchanged, invalid, and conflicting rows.
- A right-hand ticket drawer for narrow screens.

### Changed

- Replaced project-specific sample ticket keys with neutral documentation and
  test examples.

## [1.5.0] - 2026-07-23

`1.5.0` is the baseline for formal version tracking. Earlier development
history remains available in Git rather than being reconstructed here.

### Added

- A paste, preview, submit, and results workflow for turning timesheet notes
  into Jira worklogs.
- Secure Atlassian OAuth with server-side encrypted token storage.
- Demo mode for trying the complete workflow without a Jira account.
- Inline editing, deletion and undo, retry for failed entries, and CSV export.
- Local progress persistence.
- An in-app feedback form for reporting bugs and sharing suggestions.

### Changed

- Moved the app version into the footer and simplified the feedback control.
