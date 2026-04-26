export interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

const noop = () => {};

export const logger: Logger = import.meta.env.PROD
  ? {
      debug: noop,
      info: noop,
      warn: noop,
      error: noop
    }
  : {
      debug: (...args) => console.debug('[API Replay]', ...args),
      info: (...args) => console.info('[API Replay]', ...args),
      warn: (...args) => console.warn('[API Replay]', ...args),
      error: (...args) => console.error('[API Replay]', ...args)
    };