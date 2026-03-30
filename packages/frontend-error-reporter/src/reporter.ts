export interface ErrorReporterOptions {
  onError?: (error: Error, context?: Record<string, unknown>) => void;
  sentry?: {
    captureException: (error: Error, context?: Record<string, unknown>) => void;
  };
}

interface ErrorReporterState {
  initialized: boolean;
  options: ErrorReporterOptions;
}

const state: ErrorReporterState = {
  initialized: false,
  options: {},
};

export const errorReporter = {
  init(options: ErrorReporterOptions = {}): void {
    state.options = options;
    state.initialized = true;
  },

  report(error: unknown, context?: Record<string, unknown>): void {
    const err = error instanceof Error ? error : new Error(String(error));

    // Always log to console in development
    console.error("[ErrorReporter]", err, context);

    // Call Sentry if configured
    if (state.options.sentry) {
      state.options.sentry.captureException(err, context);
    }

    // Call custom onError callback
    if (state.options.onError) {
      state.options.onError(err, context);
    }
  },

  reset(): void {
    state.initialized = false;
    state.options = {};
  },

  get isInitialized(): boolean {
    return state.initialized;
  },
};
