"use client";

import { useState, useCallback } from "react";

interface UseAnalysisResult<T> {
  loading: boolean;
  error: string | null;
  result: T | null;
  analyze: (fetcher: () => Promise<T>) => Promise<void>;
  reset: () => void;
}

export function useAnalysis<T>(): UseAnalysisResult<T> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<T | null>(null);

  const analyze = useCallback(async (fetcher: () => Promise<T>) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await fetcher();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setResult(null);
  }, []);

  return { loading, error, result, analyze, reset };
}
