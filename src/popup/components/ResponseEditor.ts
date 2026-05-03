import type { RecordedRequest } from '../../shared/recording';

function isBase64(str: string): boolean {
  return /^[A-Za-z0-9+/]*={0,2}$/.test(str) && str.length % 4 === 0 && str.length > 0;
}

function tryDecodeBase64(str: string): string {
  try {
    return decodeURIComponent(escape(atob(str)));
  } catch {
    return str;
  }
}

export function formatResponseBody(request: RecordedRequest): string {
  if (typeof request.responseBody === 'string') {
    let body = request.responseBody;
    if (isBase64(body)) {
      const decoded = tryDecodeBase64(body);
      if (decoded !== body) {
        body = decoded;
      }
    }
    try {
      return JSON.stringify(JSON.parse(body), null, 2);
    } catch {
      return body;
    }
  }

  if (typeof request.responseBody === 'object') {
    return JSON.stringify(request.responseBody, null, 2);
  }

  return String(request.responseBody ?? '');
}

export function renderApiCallDetails(container: HTMLElement, request: RecordedRequest) {
  container.innerHTML = `
    <div class="mb-2">
      <strong class="dark:text-gray-300">URL:</strong> <span class="dark:text-gray-400">${request.url}</span>
    </div>
    <div class="mb-2">
      <strong class="dark:text-gray-300">Method:</strong> <span class="dark:text-gray-400">${request.method}</span>
    </div>
    <div class="mb-2">
      <strong class="dark:text-gray-300">Status:</strong> <span class="dark:text-gray-400">${request.status}</span>
    </div>
    <div class="mb-2">
      <strong class="dark:text-gray-300">Response Headers:</strong>
      <pre class="text-xs bg-gray-100 dark:bg-gray-600 p-2 rounded mt-1 dark:text-gray-300">${JSON.stringify(request.responseHeaders, null, 2)}</pre>
    </div>
  `;
}
