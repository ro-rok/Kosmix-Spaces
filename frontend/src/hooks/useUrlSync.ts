import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchFilters } from '@/types/models';

/**
 * Custom hook for synchronizing search filters with URL parameters
 */
export function useUrlSync() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse filters from URL
  const parseFiltersFromUrl = useCallback((): SearchFilters => {
    const locality = searchParams.getAll('locality');
    const budgetBand = searchParams.getAll('budget');
    const teamSize = searchParams.get('teamSize') || '';
    const amenities = searchParams.getAll('amenities');
    
    return {
      locality,
      teamSize,
      budgetBand,
      meetingRooms: searchParams.get('meetingRooms') === 'true',
      privateOffice: searchParams.get('privateOffice') === 'true',
      verifiedOnly: searchParams.get('verifiedOnly') === 'true',
      amenities,
    };
  }, [searchParams]);

  // Update URL with filters
  const updateUrlWithFilters = useCallback((
    filters: SearchFilters, 
    sort?: string, 
    page?: number,
    query?: string
  ) => {
    const params = new URLSearchParams();
    
    // Add query if present
    if (query && query.trim()) {
      params.set('q', query.trim());
    }
    
    // Add filters
    filters.locality.forEach(loc => params.append('locality', loc));
    filters.budgetBand.forEach(budget => params.append('budget', budget));
    
    if (filters.teamSize) params.set('teamSize', filters.teamSize);
    if (filters.meetingRooms) params.set('meetingRooms', 'true');
    if (filters.privateOffice) params.set('privateOffice', 'true');
    if (filters.verifiedOnly) params.set('verifiedOnly', 'true');
    
    filters.amenities.forEach(amenity => params.append('amenities', amenity));
    
    // Add sort and page
    if (sort && sort !== 'recommended') params.set('sort', sort);
    if (page && page > 1) params.set('page', page.toString());
    
    setSearchParams(params);
  }, [setSearchParams]);

  // Get current values from URL
  const getCurrentQuery = useCallback(() => {
    return searchParams.get('q') || '';
  }, [searchParams]);

  const getCurrentSort = useCallback(() => {
    return searchParams.get('sort') || 'recommended';
  }, [searchParams]);

  const getCurrentPage = useCallback(() => {
    const page = searchParams.get('page');
    return page ? parseInt(page, 10) : 1;
  }, [searchParams]);

  return {
    parseFiltersFromUrl,
    updateUrlWithFilters,
    getCurrentQuery,
    getCurrentSort,
    getCurrentPage,
  };
}