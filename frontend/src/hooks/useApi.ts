import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";

// Localities
export function useLocalities() {
  return useQuery({
    queryKey: ["localities"],
    queryFn: async () => {
      const response = await api.getLocalities();
      // Return flat array for backward compatibility, but also provide structured data
      return {
        ...response,
        // For backward compatibility, default to flat array
        localities: response.flat || [],
        // Structured data by city
        by_city: response.by_city || {},
        // Flat array
        flat: response.flat || []
      };
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors, but retry on network errors
      if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
    // Transform the data to maintain backward compatibility
    select: (data) => {
      // If the API returns the old format (array), handle it
      if (Array.isArray(data)) {
        return {
          localities: data,
          by_city: {},
          flat: data
        };
      }
      // New structured format
      return {
        localities: data.flat || [],
        by_city: data.by_city || {},
        flat: data.flat || []
      };
    }
  });
}

// Listings
export function useListings(params: Parameters<typeof api.getListings>[0] = {}) {
  return useQuery({
    queryKey: ["listings", params],
    queryFn: () => api.getListings(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

export function useListingDetail(slug: string) {
  return useQuery({
    queryKey: ["listing", slug],
    queryFn: () => api.getListingDetail(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

// Leads
export function useCreateLead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.createLead,
    onSuccess: () => {
      // Invalidate any relevant queries if needed
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

// Site visits
export function useCreateSiteVisit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.createSiteVisit,
    onSuccess: () => {
      // Invalidate any relevant queries if needed
      queryClient.invalidateQueries({ queryKey: ["visits"] });
    },
  });
}