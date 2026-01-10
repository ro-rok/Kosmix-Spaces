import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from './useDebounce';
import { api } from '@/lib/api';
import { SearchFilters } from '@/types/models';

interface SearchParams {
  query?: string;
  filters: SearchFilters;
  sort: 'recommended' | 'most-enquired' | 'budget-low';
  page: number;
  pageSize?: number;
}

/**
 * Custom hook for search with debouncing and caching
 */
export function useSearchWithCache(params: SearchParams) {
  const [searchQuery, setSearchQuery] = useState(params.query || '');
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Convert frontend filters to API parameters
  const apiParams = {
    // Map locality array to single locality (API limitation)
    locality: params.filters.locality.length > 0 ? params.filters.locality[0] : undefined,
    budgetBandId: params.filters.budgetBand.length > 0 ? params.filters.budgetBand.join(',') : undefined,
    teamSizeBand: params.filters.teamSize || undefined,
    // Map boolean filters to API format
    nearMetro: params.filters.meetingRooms ? true : undefined,
    parking: params.filters.privateOffice ? 'required' : undefined,
    powerBackup: params.filters.verifiedOnly ? true : undefined,
    // Map sort options to API format
    sort: params.sort === 'recommended' ? 'best_match' : 
          params.sort === 'most-enquired' ? 'recent_verified' : 
          'budget_low',
    page: params.page,
    pageSize: params.pageSize || 12,
    // Add search query if present
    ...(debouncedQuery && { search: debouncedQuery })
  };

  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['search-listings', apiParams],
    queryFn: () => api.public.getListings(apiParams),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    keepPreviousData: true, // Keep previous results while loading new ones
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (error && 'status' in error && typeof error.status === 'number' && error.status >= 400 && error.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
  });

  const updateSearchQuery = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  return {
    data: data || { items: [], total: 0, page: 1, pageSize: 12 },
    isLoading,
    error,
    refetch,
    searchQuery,
    updateSearchQuery,
    debouncedQuery
  };
}