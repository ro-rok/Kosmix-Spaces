import { useState, useEffect } from "react";
import { Loader2, SlidersHorizontal, Grid3X3, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchBar } from "@/components/SearchBar";
import { FilterDrawer } from "@/components/FilterDrawer";
import { ListingCard } from "@/components/ListingCard";
import { ListingGridSkeleton } from "@/components/Skeletons";
import { SearchPagination } from "@/components/SearchPagination";
import { AppliedFilters } from "@/components/AppliedFilters";
import { SearchEmptyState } from "@/components/SearchEmptyState";
import { StickyCTA } from "@/components/StickyCTA";
import { SearchFilters } from "@/types/models";
import { useSearchWithCache } from "@/hooks/useSearchWithCache";
import { useUrlSync } from "@/hooks/useUrlSync";
import { cn } from "@/lib/utils";

// Initial empty filters
const initialFilters: SearchFilters = {
  locality: [],
  teamSize: '',
  budgetBand: [],
  meetingRooms: false,
  privateOffice: false,
  verifiedOnly: false,
  amenities: [],
};

export default function Explore() {
  const {
    parseFiltersFromUrl,
    updateUrlWithFilters,
    getCurrentQuery,
    getCurrentSort,
    getCurrentPage,
  } = useUrlSync();

  // Initialize state from URL
  const [filters, setFilters] = useState<SearchFilters>(() => parseFiltersFromUrl());
  const [sort, setSort] = useState<'recommended' | 'most-enquired' | 'budget-low'>(() => 
    getCurrentSort() as 'recommended' | 'most-enquired' | 'budget-low'
  );
  const [page, setPage] = useState(() => getCurrentPage());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Search with caching and debouncing
  const {
    data: searchData,
    isLoading,
    error,
    searchQuery,
    updateSearchQuery,
    debouncedQuery
  } = useSearchWithCache({
    query: getCurrentQuery(),
    filters,
    sort,
    page,
    pageSize: 12
  });

  const { items: listings, total, pageSize } = searchData;
  const totalPages = Math.ceil(total / pageSize);

  // Sync URL when filters, sort, or page changes
  useEffect(() => {
    updateUrlWithFilters(filters, sort, page, debouncedQuery);
  }, [filters, sort, page, debouncedQuery, updateUrlWithFilters]);

  // Reset page when filters change
  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    }
  }, [filters, sort, debouncedQuery]);

  const handleFilterChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
  };

  const handleRemoveFilter = (filterType: keyof SearchFilters, value?: string) => {
    const newFilters = { ...filters };
    
    if (filterType === 'locality' && value) {
      newFilters.locality = newFilters.locality.filter(l => l !== value);
    } else if (filterType === 'budgetBand' && value) {
      newFilters.budgetBand = newFilters.budgetBand.filter(b => b !== value);
    } else if (filterType === 'amenities' && value) {
      newFilters.amenities = newFilters.amenities.filter(a => a !== value);
    } else if (filterType === 'teamSize') {
      newFilters.teamSize = '';
    } else if (filterType === 'meetingRooms') {
      newFilters.meetingRooms = false;
    } else if (filterType === 'privateOffice') {
      newFilters.privateOffice = false;
    } else if (filterType === 'verifiedOnly') {
      newFilters.verifiedOnly = false;
    }
    
    setFilters(newFilters);
  };

  const clearAllFilters = () => {
    setFilters(initialFilters);
    updateSearchQuery('');
  };

  const handleSuggestedSearch = (localityId: string) => {
    setFilters({
      ...initialFilters,
      locality: [localityId]
    });
  };

  const handleLocalitySelect = (localityId: string) => {
    setFilters({
      ...filters,
      locality: [localityId]
    });
  };

  const handleSortChange = (newSort: string) => {
    setSort(newSort as 'recommended' | 'most-enquired' | 'budget-low');
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Count active filters
  const activeFilterCount = [
    ...filters.locality,
    ...filters.budgetBand,
    filters.teamSize,
    ...filters.amenities,
    filters.meetingRooms,
    filters.privateOffice,
    filters.verifiedOnly
  ].filter(Boolean).length;

  if (error) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive">Unable to load listings</h2>
          <p className="text-muted-foreground mt-2">
            {error instanceof Error && error.message.includes('Network error') 
              ? 'Please check if the backend server is running'
              : 'Please try again later'
            }
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Backend should be running at: {import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 md:pb-0">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-16 z-40">
        <div className="container py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <SearchBar
                variant="compact"
                initialValue={searchQuery}
                onSearch={updateSearchQuery}
                onLocalitySelect={handleLocalitySelect}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="hidden sm:flex border border-border rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8 w-8 p-0"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-8 w-8 p-0"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              {/* Sort */}
              <Select value={sort} onValueChange={handleSortChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recommended">Recommended</SelectItem>
                  <SelectItem value="most-enquired">Most Enquired</SelectItem>
                  <SelectItem value="budget-low">Budget: Low → High</SelectItem>
                </SelectContent>
              </Select>

              {/* Filter */}
              <FilterDrawer
                filters={filters}
                onChange={handleFilterChange}
                onClear={clearAllFilters}
              />
            </div>
          </div>

          {/* Applied Filters */}
          <AppliedFilters
            filters={filters}
            onRemoveFilter={handleRemoveFilter}
            onClearAll={clearAllFilters}
            className="mt-3"
          />
        </div>
      </div>

      {/* Results */}
      <div className="container py-8">
        {/* Results Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                {filters.locality.length > 0 
                  ? `Workspaces in ${filters.locality.length === 1 ? filters.locality[0] : `${filters.locality.length} areas`}`
                  : searchQuery
                  ? `Search results for "${searchQuery}"`
                  : "All Workspaces in Delhi"
                }
              </h1>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-muted-foreground">
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Searching...
                    </span>
                  ) : (
                    `${total.toLocaleString()} ${total === 1 ? "space" : "spaces"} found`
                  )}
                </p>
                {activeFilterCount > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} applied
                  </p>
                )}
              </div>
            </div>
            
            {/* Sort indicator */}
            <div className="hidden md:block text-sm text-muted-foreground">
              Sorted by: {sort === 'recommended' ? 'Recommended' : 
                        sort === 'most-enquired' ? 'Most Enquired' : 
                        'Budget: Low → High'}
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <ListingGridSkeleton count={12} />
        ) : listings.length > 0 ? (
          <>
            {/* Listings Grid */}
            <div className={cn(
              "grid gap-6",
              viewMode === 'grid' 
                ? "sm:grid-cols-2 lg:grid-cols-3" 
                : "grid-cols-1 max-w-4xl"
            )}>
              {listings.map((listing) => (
                <ListingCard 
                  key={listing.slug} 
                  listing={listing} 
                  variant="premium"
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <SearchPagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={total}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                className="mt-12"
              />
            )}
          </>
        ) : (
          <SearchEmptyState
            filters={filters}
            searchQuery={searchQuery}
            onClearFilters={clearAllFilters}
            onSuggestedSearch={handleSuggestedSearch}
          />
        )}
      </div>

      {/* Mobile Sticky CTA */}
      <StickyCTA />
    </div>
  );
}
