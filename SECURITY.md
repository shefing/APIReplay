# Security Policy

## Reporting a vulnerability

Please report security issues privately by opening a GitHub security advisory or contacting the maintainers directly. Do not publish exploit details in public issues.

Include:
- Affected version
- Reproduction steps
- Impact assessment
- Any suggested remediation

## Supported versions

Security fixes are prioritized for the latest release line.

## Security notes

- API Replay runs fully in the browser and does not send recorded traffic to external servers.
- Imported recordings are validated before persistence.
- The extension requires `debugger` and `<all_urls>` to intercept and fulfill network requests via Chrome DevTools Protocol during record/replay workflows.
- Keep dependencies updated and run CI checks (`lint`, `typecheck`, `test`, `build`) before release.
