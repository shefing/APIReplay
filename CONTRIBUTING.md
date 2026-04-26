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

## Project standards

- Keep changes focused and backward-compatible where possible.
- Add or update tests for non-trivial logic changes.
- Keep TypeScript and ESLint checks green.
- Update `README.md` and `CHANGELOG.md` when behavior or release content changes.

## Pull requests

- Use clear PR titles and include the problem + solution summary.
- Include validation evidence (commands run and results).
- For UI changes, include screenshots or short recordings.

## Release process

- Ensure `src/manifest.json` version is updated.
- Create a tag in the format `vX.Y.Z` matching `manifest.json`.
- GitHub Actions will build and attach `dist.zip` to the release.
