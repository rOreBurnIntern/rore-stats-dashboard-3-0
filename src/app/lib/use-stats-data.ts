'use client';

import { useEffect, useState } from 'react';
import type { DbStatsData } from './db-stats';

let statsDataPromise: Promise<DbStatsData | null> | null = null;

async function fetchStatsData(): Promise<DbStatsData | null> {
  const response = await fetch('/api/stats', { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`Failed to fetch stats: ${response.status}`);
  }

  return response.json();
}

function loadStatsData() {
  if (!statsDataPromise) {
    statsDataPromise = fetchStatsData().catch((error) => {
      statsDataPromise = null;
      throw error;
    });
  }

  return statsDataPromise;
}

export function useStatsData(initialData: DbStatsData | null = null) {
  const [data, setData] = useState<DbStatsData | null>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    if (initialData) {
      setData(initialData);
      setLoading(false);
      setError(null);
      return () => {
        isActive = false;
      };
    }

    setLoading(true);

    loadStatsData()
      .then((nextData) => {
        if (!isActive) {
          return;
        }

        setData(nextData);
        setError(null);
      })
      .catch((nextError: unknown) => {
        if (!isActive) {
          return;
        }

        setData(null);
        setError(
          nextError instanceof Error
            ? nextError.message
            : 'Failed to load stats data'
        );
      })
      .finally(() => {
        if (isActive) {
          setLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [initialData]);

  return { data, loading, error };
}
