import { useState, useEffect, useRef, useCallback } from 'react';

export const useSearch = <T = any>(
  searchFn: (query: string) => Promise<T[]>,
  debounceMs = 400,
  minLength = 3,
  defaultQuery: string = '' // NEW: Optional default query for initial search
) => {
  const [query, setQuery] = useState(defaultQuery);
  const [results, setResults] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const debounceTimer = useRef<NodeJS.Timeout>();
  const cacheRef = useRef<Record<string, T[]>>({});
  const abortControllerRef = useRef<AbortController | null>(null);

  const executeSearch = useCallback(
    async (searchQuery: string) => {
      // Cancel any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // If query is present but shorter than minLength, we do not call the API.
      if (searchQuery.length > 0 && searchQuery.length < minLength) {
         setResults([]);
         setError('');
         return;
      }

      // If searching an empty string, call searchFn to signal the dependent component
      // (like TanStack Query) to reset its query dependency. We skip internal loading/caching.
      if (searchQuery.length === 0) {
          await searchFn('');
          setResults([]);
          setError('');
          return;
      }

      // Check cache (only for non-empty queries)
      if (cacheRef.current[searchQuery]) {
        setResults(cacheRef.current[searchQuery]);
        setError('');
        return;
      }

      // Create new AbortController for this request
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setIsLoading(true);
      setError('');

      try {
        const data = await searchFn(searchQuery);
        
        // Only update if request wasn't aborted
        if (!abortController.signal.aborted) {
          setResults(data);
          cacheRef.current[searchQuery] = data;
        }
      } catch (err: any) {
        // Ignore abort errors
        if (err?.name === 'AbortError' || abortController.signal.aborted) {
          return;
        }
        console.error("Search execution failed:", err);
        if (!abortController.signal.aborted) {
          setError('Search failed. Please try again.');
          setResults([]);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [searchFn, minLength]
  );

  // NEW: Effect to trigger search immediately on mount if a default query is present
  useEffect(() => {
      if (defaultQuery) {
          // Trigger initial search without debounce
          executeSearch(defaultQuery);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = useCallback(
    (newQuery: string) => {
      setQuery(newQuery);

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // If query is empty, immediately trigger executeSearch to reset the TanStack dependency
      if (!newQuery) {
        executeSearch('');
        return;
      }

      // If query is present and less than minLength, stop here (UI shows the warning)
      if (newQuery.length < minLength) {
          return;
      }

      // If query meets or exceeds minLength, debounce the API call
      debounceTimer.current = setTimeout(() => {
        executeSearch(newQuery);
      }, debounceMs);
    },
    [executeSearch, debounceMs, minLength]
  );

  // NEW: Function to force a search immediately (used for Enter key press)
  const handleSearchSubmit = useCallback(() => {
      if (query.length >= minLength) {
          if (debounceTimer.current) {
              clearTimeout(debounceTimer.current);
          }
          executeSearch(query);
      }
  }, [query, minLength, executeSearch]);


  const handleClear = useCallback(() => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    setQuery('');
    setResults([]);
    setError('');
    setIsLoading(false);
    // Explicitly execute search with an empty string to reset the TanStack query dependency
    executeSearch('');
  }, [executeSearch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return {
    query,
    results,
    isLoading,
    error,
    handleSearch,
    handleClear,
    handleSearchSubmit, // Exported submit function
    setResults,
  };
};