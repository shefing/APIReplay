import type { BrowserContext, Request, Route } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { normalizeRecording } from '../../src/shared/schema';

type RecordedRequest = {
  key: string;
  method: string;
  url: string;
  path: string;
  status: number;
  headers: Record<string, string>;
  body: string;
};

export interface RecordingMockOptions {
  fallbackMatching?: boolean;
  strictUnmatched?: boolean;
  urlBase?: string;
  debug?: (message: string) => void;
}

export async function applyRecordingMocks(
  context: BrowserContext,
  recordingPath: string,
  options: RecordingMockOptions = {}
): Promise<{ dispose: () => Promise<void> }> {
  const raw = await readFile(path.resolve(recordingPath), 'utf-8');
  const parsed = JSON.parse(raw);
  const recording = normalizeRecording(parsed);

  if (!recording) {
    throw new Error(`Unable to parse recording JSON at ${recordingPath}`);
  }

  const enabledRequests = Object.entries(recording.requests)
    .filter(([, request]) => request.enabled !== false)
    .map(([key, request]): RecordedRequest => {
      const requestUrl = normalizeUrl(request.url, options.urlBase);
      const requestPath = getPathnameAndSearch(requestUrl);
      return {
        key,
        method: request.method.toUpperCase(),
        url: requestUrl,
        path: requestPath,
        status: request.status ?? 200,
        headers: {
          'content-type': 'application/json',
          ...(request.responseHeaders ?? {})
        },
        body: request.responseBody ?? ''
      };
    });

  const exactIndex = new Map<string, RecordedRequest>();
  const fallbackIndex = new Map<string, RecordedRequest>();

  for (const request of enabledRequests) {
    exactIndex.set(toExactKey(request.method, request.url), request);
    if (!fallbackIndex.has(toFallbackKey(request.method, request.path))) {
      fallbackIndex.set(toFallbackKey(request.method, request.path), request);
    }
  }

  const routeHandler = async (route: Route, request: Request) => {
    const method = request.method().toUpperCase();
    const url = request.url();
    const exactMatch = exactIndex.get(toExactKey(method, url));

    const fallbackMatch =
      !exactMatch && options.fallbackMatching
        ? fallbackIndex.get(toFallbackKey(method, getPathnameAndSearch(url)))
        : undefined;

    const matchedRequest = exactMatch ?? fallbackMatch;

    if (!matchedRequest) {
      const message = `No recording match for ${method} ${url}`;
      options.debug?.(message);
      if (options.strictUnmatched) {
        throw new Error(message);
      }
      await route.continue();
      return;
    }

    await route.fulfill({
      status: matchedRequest.status,
      headers: matchedRequest.headers,
      body: matchedRequest.body
    });
  };

  await context.route('**/*', routeHandler);

  return {
    dispose: async () => {
      await context.unroute('**/*', routeHandler);
    }
  };
}

function toExactKey(method: string, url: string): string {
  return `${method} ${url}`;
}

function toFallbackKey(method: string, pathValue: string): string {
  return `${method} ${pathValue}`;
}

function getPathnameAndSearch(urlValue: string): string {
  const url = new URL(urlValue);
  return `${url.pathname}${url.search}`;
}

function normalizeUrl(urlValue: string, urlBase?: string): string {
  if (!urlBase) {
    return urlValue;
  }

  try {
    const parsed = new URL(urlValue);
    const base = new URL(urlBase);
    parsed.protocol = base.protocol;
    parsed.host = base.host;
    return parsed.toString();
  } catch {
    return new URL(urlValue, urlBase).toString();
  }
}