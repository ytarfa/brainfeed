import { useCallback } from "react";

import { errorReporter } from "./reporter";

export interface UseErrorReporterResult {
  report: (error: unknown, context?: Record<string, unknown>) => void;
}

export function useErrorReporter(): UseErrorReporterResult {
  const report = useCallback(
    (error: unknown, context?: Record<string, unknown>) => {
      errorReporter.report(error, context);
    },
    [],
  );

  return { report };
}
