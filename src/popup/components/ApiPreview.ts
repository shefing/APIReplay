import type { RecordedRequest } from '../../shared/recording';

export function renderApiPaths(
  container: HTMLElement,
  requests: Record<string, RecordedRequest>,
  requestHitCounts: Record<string, number>,
  onSelectPath: (path: string) => void,
  onToggleEnabled: (requestKey: string, enabled: boolean) => void,
  onUpdateStatus: (requestKey: string, status: number | undefined) => void,
  options: { matchedKeys?: Record<string, number>; isReplaying?: boolean } = {}
) {
  // Match indicator is currently disabled — matching has known reliability gaps where
  // some matched URLs were not flagged. Until the matcher is fixed, we hide the per-row
  // indicator and the green-tint highlight so users are not misled by stale state.
  void options;
  const rows = Object.entries(requests).sort(([a], [b]) => a.localeCompare(b));

  function statusColorClass(status: number | undefined): string {
    if (typeof status !== 'number') return 'bg-gray-300 dark:bg-gray-600';
    if (status >= 500) return 'bg-red-500';
    if (status >= 400) return 'bg-amber-500';
    if (status >= 300) return 'bg-blue-500';
    if (status >= 200) return 'bg-green-500';
    return 'bg-gray-400';
  }

  container.innerHTML = `
    <h4 class="font-semibold mb-1 text-xs">API Requests:</h4>
    ${rows.length === 0 ? '<div class="text-xs opacity-70">No matching requests.</div>' : `
      <div class="border border-gray-300 dark:border-gray-600 rounded overflow-x-auto">
        <table class="w-full text-xs">
          <thead class="bg-gray-200 dark:bg-gray-800">
            <tr>
              <th class="text-left p-1 w-px whitespace-nowrap" title="Include this request when replaying">▶</th>
              <th class="text-left p-1 w-px whitespace-nowrap" title="HTTP response status (color-coded). Click to edit. Number in parentheses = replay hits.">Status</th>
              <th class="text-left p-1 w-px whitespace-nowrap">Method</th>
              <th class="text-left p-1">Path</th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(([key, request]) => {
                const url = new URL(request.url);
                const path = url.pathname + url.search;
                const pathWithoutQuery = path.split('?')[0];
                const replayCount = requestHitCounts[pathWithoutQuery] || 0;
                const statusNum = typeof request.status === 'number' ? request.status : undefined;
                const statusBase = statusNum !== undefined ? String(statusNum) : '—';
                const statusText = replayCount > 0 ? `${statusBase} (${replayCount})` : statusBase;
                const enabled = request.enabled !== false;
                const fullUrlAttr = request.url.replace(/"/g, '&quot;');
                const pathAttr = path.replace(/"/g, '&quot;');
                const statusTitle = statusNum !== undefined
                  ? replayCount > 0
                    ? `Response status: ${statusNum} • ${replayCount} replay hit(s) (click to edit)`
                    : `Response status: ${statusNum} (click to edit)`
                  : 'No status recorded (click to set)';
                const statusBadgeWidth = statusText.length > 3 ? 'min-w-[2.1rem] px-1' : 'w-7';
                return `
                  <tr class="border-t border-gray-200 dark:border-gray-700">
                    <td class="p-1 w-px whitespace-nowrap">
                      <input type="checkbox" class="request-enabled-toggle" data-request-key="${encodeURIComponent(key)}" ${enabled ? 'checked' : ''}>
                    </td>
                    <td class="p-1 w-px whitespace-nowrap">
                      <button
                        type="button"
                        class="request-status-icon inline-flex items-center justify-center ${statusBadgeWidth} h-5 rounded-full text-[9px] font-bold text-white whitespace-nowrap ${statusColorClass(statusNum)}"
                        data-request-key="${encodeURIComponent(key)}"
                        data-status="${statusNum ?? ''}"
                        title="${statusTitle}"
                      >${statusText}</button>
                    </td>
                    <td class="p-1 w-px whitespace-nowrap">${request.method}</td>
                    <td class="p-1 cursor-pointer hover:text-blue-500 truncate max-w-0" data-path="${pathAttr}" title="${fullUrlAttr}">${path}</td>
                  </tr>
                `;
              })
              .join('')}
          </tbody>
        </table>
      </div>
    `}
  `;

  container.querySelectorAll('[data-path]').forEach((element) => {
    element.addEventListener('click', () => {
      const path = element.getAttribute('data-path');
      if (path) {
        onSelectPath(path);
      }
    });
  });

  container.querySelectorAll('.request-enabled-toggle').forEach((element) => {
    element.addEventListener('change', () => {
      const input = element as HTMLInputElement;
      const encodedKey = input.getAttribute('data-request-key');
      if (!encodedKey) {
        return;
      }
      onToggleEnabled(decodeURIComponent(encodedKey), input.checked);
    });
  });

  container.querySelectorAll('.request-status-icon').forEach((element) => {
    const button = element as HTMLButtonElement;
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const encodedKey = button.getAttribute('data-request-key');
      if (!encodedKey) {
        return;
      }
      const current = button.getAttribute('data-status') || '';
      const input = window.prompt('Set response status (100-599, empty to clear):', current);
      if (input === null) {
        return;
      }
      const trimmed = input.trim();
      if (trimmed.length === 0) {
        onUpdateStatus(decodeURIComponent(encodedKey), undefined);
        return;
      }
      const parsed = Number(trimmed);
      if (!Number.isFinite(parsed) || parsed < 100 || parsed > 599) {
        alert('Status must be a number between 100 and 599.');
        return;
      }
      onUpdateStatus(decodeURIComponent(encodedKey), Math.floor(parsed));
    });
  });
}
