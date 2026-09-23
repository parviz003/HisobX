import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

/**
 * Filtrlarni URL query parametrlarida saqlaydi (4-bo'lim, 5-qoida):
 * sahifani yangilasa ham, havolani ulashsa ham holat saqlanadi.
 */
export function useUrlFilters<T extends Record<string, string | undefined>>(defaults: T) {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => {
    const result = { ...defaults };
    for (const key of Object.keys(defaults)) {
      const value = searchParams.get(key);
      if (value !== null) result[key as keyof T] = value as T[keyof T];
    }
    return result;
  }, [searchParams, defaults]);

  const setFilter = useCallback(
    (key: keyof T & string, value: string | undefined) => {
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          if (value === undefined || value === '') next.delete(key);
          else next.set(key, value);
          // Filtr o'zgarsa doim birinchi sahifadan boshlaymiz.
          next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const clearFilters = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  return { filters, setFilter, clearFilters };
}
