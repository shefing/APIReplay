# Contributing

Thanks for contributing to API Replay.

## Development setup

1. Install dependencies:
   ```bash
   npm ci
   ```
2. Run quality checks:
   ```bash
   npm run lint
   npm run typecheck
   npm run test
   ```
3. Build the extension:
   ```bash
   npm run build
   ```

## iSDLC daily workflow (required)

Use the iSDLC loop for every non-trivial change:

1. Create/activate a plan:
   ```bash
   isdlc plan new "<change-title>"
   ```
2. Record architecture decisions when direction changes:
   ```bash
   isdlc adr new "<decision-title>"
   ```
3. Record deferred work explicitly:
   ```bash
   isdlc debt add "<debt-item>" --reason "<why deferred>"
   ```
4. Sync state after significant actions:
   ```bash
   isdlc state sync
   ```
5. Run governance checks before merge:
   ```bash
   isdlc doctor
   ```

## Project standards

- Keep changes focused and backward-compatible where possible.
- Add or update tests for non-trivial logic changes.
- Keep TypeScript and ESLint checks green.
- Update `README.md` and `CHANGELOG.md` when behavior or release content changes.

## Pull requests

- Use clear PR titles and include the problem + solution summary.
- Include validation evidence (commands run and results).
- For UI changes, include screenshots or short recordings.
- Include iSDLC evidence: active plan reference, ADR/debt links (if applicable), and latest `isdlc state sync` outcome.

## Merge readiness checklist

A change is merge-ready only when both governance and product checks are green:

- `isdlc doctor`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

## Release process

- Ensure `src/manifest.json` version is updated.
- Create a tag in the format `vX.Y.Z` matching `manifest.json`.
- GitHub Actions will build and attach `dist.zip` to the release.
