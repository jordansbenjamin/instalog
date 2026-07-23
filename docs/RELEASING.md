# Releasing instalog

instalog uses milestone releases. Deployments can happen as often as needed,
but the version changes only when a user-visible checkpoint is worth naming.

## Choosing the next version

- **Patch** (`1.5.1`) — fixes and small polish.
- **Minor** (`1.6.0`) — a meaningful backwards-compatible feature.
- **Major** (`2.0.0`) — a major redesign or intentionally incompatible change.

## Release checklist

1. Move completed notes from `Unreleased` in `CHANGELOG.md` into a dated release
   section such as `## [1.6.0] - 2026-08-12`.
2. From the repository root, update the package metadata:

   ```bash
   npm version <patch|minor|major> --no-git-tag-version
   ```

   `--no-git-tag-version` updates `package.json` and `package-lock.json` without
   committing or tagging. This leaves the release diff available for review.

3. Verify the release:

   ```bash
   npm run test:run
   npm run lint
   npm run build
   ```

4. Confirm the footer version matches the new changelog heading.
5. Commit the reviewed release:

   ```bash
   git add package.json package-lock.json CHANGELOG.md
   git commit -m "Release vX.Y.Z"
   ```

6. Create an annotated tag:

   ```bash
   git tag -a vX.Y.Z -m "Release vX.Y.Z"
   ```

7. Push the commit and tag when the milestone is ready to publish:

   ```bash
   git push origin main
   git push origin vX.Y.Z
   ```

The private package under `server/` is not versioned independently. The root
package version is the version users see and the version included in feedback
reports.
