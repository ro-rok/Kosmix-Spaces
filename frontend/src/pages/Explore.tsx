import { useState, useEffect, useMemo } from "react";
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
import { InlineLoadingAnimation } from "@/components/LoadingAnimation";
import { StaggerAnimation } from "@/components/StaggerAnimation";
import { SearchFilters } from "@/types/models";
import { useSearchWithCache } from "@/hooks/useSearchWithCache";
import { useUrlSync } from "@/hooks/useUrlSync";
import { trackSearchPerformed, trackFilterApplied, trackPageView } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { SEO, StructuredData } from "@/components/SEO";
import { generateWebSiteSchema, generateBreadcrumbSchema } from "@/lib/seo-helpers";

// Initial empty filters
const initialFilters: SearchFilters = {
  city: [], // Default to Delhi NCR (will be set based on URL or default)
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
  const [filters, setFilters] = useState<SearchFilters>(() => {
    const urlFilters = parseFiltersFromUrl();
    // If no city is specified, default to Delhi NCR
    if (urlFilters.city.length === 0) {
      return {
        ...urlFilters,
        city: ['Delhi', 'Noida', 'Gurugram'] // Default Delhi NCR
      };
    }
    return urlFilters;
  });
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

  // Note: page_view is already tracked by App.tsx PageViewTracker

  // Sync URL when filters, sort, or page changes
  useEffect(() => {
    updateUrlWithFilters(filters, sort, page, debouncedQuery);
  }, [filters, sort, page, debouncedQuery, updateUrlWithFilters]);

  // Track search when query changes
  useEffect(() => {
    if (debouncedQuery) {
      const appliedFilters = [
        ...filters.city,
        ...filters.locality,
        ...filters.budgetBand,
        ...filters.amenities,
        filters.teamSize,
        filters.meetingRooms ? 'meeting-rooms' : '',
        filters.privateOffice ? 'private-office' : '',
        filters.verifiedOnly ? 'verified-only' : ''
      ].filter(Boolean);
      
      trackSearchPerformed(debouncedQuery, appliedFilters, {
        filtersCount: appliedFilters.length,
        sort,
        page
      });
    }
  }, [debouncedQuery, filters, sort, page]);

  // Reset page when filters change
  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    }
  }, [filters, sort, debouncedQuery]);

  const handleFilterChange = (newFilters: SearchFilters) => {
    // Track filter changes
    const oldFilters = filters;
    const newFilterKeys = Object.keys(newFilters) as (keyof SearchFilters)[];
    
    // Track each filter that was added or changed
    newFilterKeys.forEach(key => {
      const oldValue = oldFilters[key];
      const newValue = newFilters[key];
      
      // Handle array filters (city, locality, budgetBand, amenities)
      if (Array.isArray(newValue) && Array.isArray(oldValue)) {
        const addedItems = newValue.filter(item => !oldValue.includes(item));
        const removedItems = oldValue.filter(item => !newValue.includes(item));
        
        addedItems.forEach(item => {
          trackFilterApplied(key, item, { action: 'added' });
        });
        
        removedItems.forEach(item => {
          trackFilterApplied(key, item, { action: 'removed' });
        });
      }
      // Handle boolean filters (meetingRooms, privateOffice, verifiedOnly)
      else if (typeof newValue === 'boolean' && newValue !== oldValue) {
        trackFilterApplied(key, newValue.toString(), { 
          action: newValue ? 'enabled' : 'disabled' 
        });
      }
      // Handle string filters (teamSize)
      else if (typeof newValue === 'string' && newValue !== oldValue) {
        if (newValue) {
          trackFilterApplied(key, newValue, { action: 'set' });
        } else if (oldValue) {
          trackFilterApplied(key, oldValue, { action: 'cleared' });
        }
      }
    });
    
    setFilters(newFilters);
  };

  const handleRemoveFilter = (filterType: keyof SearchFilters, value?: string) => {
    const newFilters = { ...filters };
    
    if (filterType === 'city' && value) {
      newFilters.city = newFilters.city.filter(c => c !== value);
      // If no cities left, default back to Delhi NCR
      if (newFilters.city.length === 0) {
        newFilters.city = ['Delhi', 'Noida', 'Gurugram'];
      }
      trackFilterApplied(filterType, value, { action: 'removed' });
    } else if (filterType === 'locality' && value) {
      newFilters.locality = newFilters.locality.filter(l => l !== value);
      trackFilterApplied(filterType, value, { action: 'removed' });
    } else if (filterType === 'budgetBand' && value) {
      newFilters.budgetBand = newFilters.budgetBand.filter(b => b !== value);
      trackFilterApplied(filterType, value, { action: 'removed' });
    } else if (filterType === 'amenities' && value) {
      newFilters.amenities = newFilters.amenities.filter(a => a !== value);
      trackFilterApplied(filterType, value, { action: 'removed' });
    } else if (filterType === 'teamSize') {
      const oldValue = newFilters.teamSize;
      newFilters.teamSize = '';
      if (oldValue) {
        trackFilterApplied(filterType, oldValue, { action: 'cleared' });
      }
    } else if (filterType === 'meetingRooms') {
      newFilters.meetingRooms = false;
      trackFilterApplied(filterType, 'false', { action: 'disabled' });
    } else if (filterType === 'privateOffice') {
      newFilters.privateOffice = false;
      trackFilterApplied(filterType, 'false', { action: 'disabled' });
    } else if (filterType === 'verifiedOnly') {
      newFilters.verifiedOnly = false;
      trackFilterApplied(filterType, 'false', { action: 'disabled' });
    }
    
    setFilters(newFilters);
  };

  const clearAllFilters = () => {
    // Track clearing all filters
    trackFilterApplied('all', 'cleared', { action: 'clear_all' });
    
    setFilters({
      ...initialFilters,
      city: ['Delhi', 'Noida', 'Gurugram'] // Keep Delhi NCR as default
    });
    updateSearchQuery('');
  };

  // Generate breadcrumb schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Explore", url: "/explore" }
  ]);
  const websiteSchema = generateWebSiteSchema();

  // Generate dynamic SEO based on filters
  const seoData = useMemo(() => {
    const localities = filters.locality.length > 0 ? filters.locality.join(", ") : "";
    const cities = filters.city.length > 0 ? filters.city.join(", ") : "Delhi NCR";
    const budgetText = filters.budgetBand.length > 0 ? ` | Budget ${filters.budgetBand.join(", ")}` : "";
    
    let title = "Explore Coworking Spaces";
    let description = "Browse verified coworking spaces across Delhi NCR.";
    
    if (localities) {
      title = `Coworking Spaces in ${localities}${budgetText} | Kosmix Spaces`;
      description = `Find verified coworking spaces in ${localities}. ${total} spaces available. Zero brokerage, site visits arranged.`;
    } else if (cities !== "Delhi NCR") {
      title = `Coworking Spaces in ${cities}${budgetText} | Kosmix Spaces`;
      description = `Discover ${total} coworking spaces in ${cities}. Verified listings, no customer fees.`;
    } else {
      title = `Coworking Spaces in Delhi NCR${budgetText} | Kosmix Spaces`;
      description = `Browse ${total} verified coworking spaces across Delhi, Gurugram, Noida. Zero brokerage.`;
    }
    
    const keywords = [
      "coworking space",
      ...filters.city,
      ...filters.locality,
      "office space",
      "workspace",
      "verified coworking"
    ];
    
    return { title, description, keywords };
  }, [filters, total]);

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
    const oldSort = sort;
    setSort(newSort as 'recommended' | 'most-enquired' | 'budget-low');
    
    // Track sort change
    if (oldSort !== newSort) {
      trackFilterApplied('sort', newSort, { 
        action: 'changed',
        previousSort: oldSort 
      });
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Count active filters (excluding default Delhi NCR)
  const activeFilterCount = [
    // Only count city filters if they're different from default Delhi NCR
    ...(filters.city.length !== 3 || 
        !filters.city.includes('Delhi') || 
        !filters.city.includes('Noida') || 
        !filters.city.includes('Gurugram') ? filters.city : []),
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
    <>
      <SEO
        title={seoData.title}
        description={seoData.description}
        keywords={seoData.keywords}
        canonical="https://kosmixspaces.in/explore"
        ogTitle={seoData.title}
        ogDescription={seoData.description}
      />
      <StructuredData data={websiteSchema} />
      <StructuredData data={breadcrumbSchema} />
      <div className="pb-20 md:pb-0">
        {/* Header */}
      <div className="border-b border-border/60 glass sticky-top-safe z-40">
        <div className="container py-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Search */}
            <div className="flex-1 max-w-md animate-slide-up">
              <SearchBar
                variant="compact"
                initialValue={searchQuery}
                onSearch={updateSearchQuery}
                onLocalitySelect={handleLocalitySelect}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              {/* View Mode Toggle */}
              <div className="hidden sm:flex border border-border/60 rounded-lg p-1 glass">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8 w-8 p-0 btn-premium"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-8 w-8 p-0 btn-premium"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              {/* Sort */}
              <Select value={sort} onValueChange={handleSortChange}>
                <SelectTrigger className="w-[140px] btn-premium text-sm">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="glass">
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

          {/* Applied Filters - More compact */}
          {activeFilterCount > 0 && (
            <AppliedFilters
              filters={filters}
              onRemoveFilter={handleRemoveFilter}
              onClearAll={clearAllFilters}
              className="mt-2 animate-slide-up"
              style={{ animationDelay: '0.2s' }}
            />
          )}
        </div>
      </div>

      {/* Results */}
      <div className="container section-spacing">
        {/* Results Header - More compact */}
        <div className="mb-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-xl md:text-2xl font-bold text-foreground">
                {searchQuery ? (
                  `Search results for "${searchQuery}"`
                ) : filters.city.length === 3 && 
                     filters.city.includes('Delhi') && 
                     filters.city.includes('Noida') && 
                     filters.city.includes('Gurugram') ? (
                  filters.locality.length > 0 
                    ? `Workspaces in ${filters.locality.length === 1 ? filters.locality[0] : `${filters.locality.length} areas`} (Delhi NCR)`
                    : "All Workspaces in Delhi NCR"
                ) : filters.city.length === 1 ? (
                  filters.locality.length > 0 
                    ? `Workspaces in ${filters.locality.length === 1 ? filters.locality[0] : `${filters.locality.length} areas`} (${filters.city[0]})`
                    : `All Workspaces in ${filters.city[0]}`
                ) : (
                  filters.locality.length > 0 
                    ? `Workspaces in ${filters.locality.length === 1 ? filters.locality[0] : `${filters.locality.length} areas`}`
                    : `Workspaces in ${filters.city.join(', ')}`
                )}
              </h1>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-sm text-muted-premium">
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
                  <p className="text-xs text-muted-premium">
                    {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} applied
                  </p>
                )}
              </div>
            </div>
            
            {/* Sort indicator - More compact */}
            <div className="hidden md:block text-xs text-muted-premium">
              Sorted by: {sort === 'recommended' ? 'Recommended' : 
                        sort === 'most-enquired' ? 'Most Enquired' : 
                        'Budget: Low → High'}
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <InlineLoadingAnimation 
            isLoading={isLoading}
            text="Finding the perfect workspaces for you..."
            size="lg"
          />
        ) : listings.length > 0 ? (
          <>
            {/* Listings Grid with Staggered Animation */}
            <StaggerAnimation
              stagger={0.1}
              from="start"
              animation={{
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.6,
                ease: "power2.out",
              }}
              className={cn(
                "grid gap-6",
                viewMode === 'grid' 
                  ? "sm:grid-cols-2 lg:grid-cols-3" 
                  : "grid-cols-1 max-w-4xl"
              )}
            >
              {listings.map((listing, index) => (
                <ListingCard 
                  key={listing.slug}
                  listing={listing} 
                  variant="premium"
                  enableScrollAnimation={false} // Disable individual scroll animation since we're using stagger
                />
              ))}
            </StaggerAnimation>

            {/* Pagination */}
            {totalPages > 1 && (
              <SearchPagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={total}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                className="mt-12 animate-slide-up"
              />
            )}
          </>
        ) : (
          <SearchEmptyState
            filters={filters}
            searchQuery={searchQuery}
            onClearFilters={clearAllFilters}
            onSuggestedSearch={handleSuggestedSearch}
            className="animate-slide-up"
          />
        )}
      </div>

      {/* Mobile Sticky CTA */}
      <StickyCTA />
      </div>
    </>
  );
}
