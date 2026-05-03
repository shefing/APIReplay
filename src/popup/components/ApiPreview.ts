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
  const matchedKeys = options.matchedKeys || {};
  const isReplaying = options.isReplaying === true;
  const rows = Object.entries(requests).sort(([a], [b]) => a.localeCompare(b));

  container.innerHTML = `
    <h4 class="font-semibold mb-1 text-xs">API Requests:</h4>
    ${rows.length === 0 ? '<div class="text-xs opacity-70">No matching requests.</div>' : `
      <div class="overflow-auto border border-gray-300 dark:border-gray-600 rounded">
        <table class="w-full text-xs">
          <thead class="bg-gray-200 dark:bg-gray-800">
            <tr>
              <th class="text-left p-1" title="Include this request when replaying">Replay</th>
              <th class="text-left p-1" title="${isReplaying ? 'Green = matched at least once during replay; gray = not yet matched' : 'Match indicator is shown during replay'}">●</th>
              <th class="text-left p-1">Method</th>
              <th class="text-left p-1">Path</th>
              <th class="text-left p-1">Status</th>
              <th class="text-left p-1">Hits</th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(([key, request]) => {
                const url = new URL(request.url);
                const path = url.pathname + url.search;
                const pathWithoutQuery = path.split('?')[0];
                const replayCount = requestHitCounts[pathWithoutQuery] || 0;
                const statusValue = typeof request.status === 'number' ? String(request.status) : '';
                const enabled = request.enabled !== false;
                const matchHits = matchedKeys[key] || 0;
                const matchColor = !isReplaying
                  ? 'text-gray-300 dark:text-gray-600'
                  : matchHits > 0
                    ? 'text-green-500'
                    : 'text-gray-400 dark:text-gray-500';
                const matchTitle = !isReplaying
                  ? 'Match indicator is shown during replay'
                  : matchHits > 0
                    ? `Matched ${matchHits} time(s) during current replay`
                    : 'Not matched yet during current replay';
                return `
                  <tr class="border-t border-gray-200 dark:border-gray-700${isReplaying && matchHits > 0 ? ' bg-green-50 dark:bg-green-900/20' : ''}">
                    <td class="p-1">
                      <input type="checkbox" class="request-enabled-toggle" data-request-key="${encodeURIComponent(key)}" ${enabled ? 'checked' : ''}>
                    </td>
                    <td class="p-1 text-center ${matchColor}" title="${matchTitle}">●</td>
                    <td class="p-1">${request.method}</td>
                    <td class="p-1 cursor-pointer hover:text-blue-500" data-path="${path}">${path}</td>
                    <td class="p-1">
                      <input
                        type="number"
                        min="100"
                        max="599"
                        class="request-status-input w-16 px-1 py-0.5 rounded border border-gray-300 dark:border-gray-600 bg-transparent"
                        data-request-key="${encodeURIComponent(key)}"
                        value="${statusValue}"
                        placeholder="-"
                      >
                    </td>
                    <td class="p-1">${replayCount}</td>
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

  container.querySelectorAll('.request-status-input').forEach((element) => {
    const input = element as HTMLInputElement;
    const applyStatusUpdate = () => {
      const encodedKey = input.getAttribute('data-request-key');
      if (!encodedKey) {
        return;
      }

      const trimmed = input.value.trim();
      if (trimmed.length === 0) {
        onUpdateStatus(decodeURIComponent(encodedKey), undefined);
        return;
      }

      const parsed = Number(trimmed);
      if (!Number.isFinite(parsed) || parsed < 100 || parsed > 599) {
        input.classList.add('border-red-500');
        return;
      }

      input.classList.remove('border-red-500');
      onUpdateStatus(decodeURIComponent(encodedKey), Math.floor(parsed));
    };

    input.addEventListener('blur', applyStatusUpdate);
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        applyStatusUpdate();
        input.blur();
      }
    });
  });
}
