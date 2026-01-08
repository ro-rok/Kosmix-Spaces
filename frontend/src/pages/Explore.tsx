import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, MessageCircle, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchBar } from "@/components/SearchBar";
import { FilterDrawer } from "@/components/FilterDrawer";
import { ListingCard } from "@/components/ListingCard";
import { StickyCTA } from "@/components/StickyCTA";
import { WorkspaceType, BudgetBand } from "@/types/models";
import { useListings, useLocalities } from "@/hooks/useApi";
import { FilterState, SortOption, initialFilterState, hasActiveFilters } from "@/lib/filters";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<FilterState>(() => {
    const locality = searchParams.get("locality") || "";
    const spaceType = (searchParams.get("type") as WorkspaceType) || "";
    return { ...initialFilterState, locality, spaceType };
  });
  const [sort, setSort] = useState<SortOption>("best-match");

  // Fetch data from API
  const { data: localitiesData, isLoading: localitiesLoading } = useLocalities();
  const { data: listingsData, isLoading: listingsLoading, error: listingsError } = useListings({
    locality: filters.locality || undefined,
    budgetBandId: filters.budgetBand || undefined,
    teamSizeBand: filters.teamSize || undefined,
    spaceType: filters.spaceType || undefined,
    nearMetro: filters.nearMetro || undefined,
    parking: filters.parking ? "required" : undefined,
    powerBackup: filters.powerBackup || undefined,
    gstInvoice: filters.gstInvoice || undefined,
    sort: sort === "best-match" ? "best_match" : sort === "budget-low" ? "budget_low" : "recent_verified",
  });

  const localities = localitiesData || [];
  const listings = listingsData?.items || [];
  const isLoading = localitiesLoading || listingsLoading;

  // Sync URL params with filters
  useEffect(() => {
    const locality = searchParams.get("locality") || "";
    const spaceType = (searchParams.get("type") as WorkspaceType) || "";
    if (locality !== filters.locality || spaceType !== filters.spaceType) {
      setFilters((prev) => ({ ...prev, locality, spaceType }));
    }
  }, [searchParams]);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    // Update URL
    const params = new URLSearchParams();
    if (newFilters.locality) params.set("locality", newFilters.locality);
    if (newFilters.spaceType) params.set("type", newFilters.spaceType);
    setSearchParams(params);
  };

  const clearFilters = () => {
    setFilters(initialFilterState);
    setSearchParams({});
  };

  const handleSearch = (localityId: string) => {
    handleFilterChange({ ...filters, locality: localityId });
  };

  const selectedLocality = localities.find((l) => l.id === filters.locality);

  if (listingsError) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive">Unable to load listings</h2>
          <p className="text-muted-foreground mt-2">
            {listingsError instanceof Error && listingsError.message.includes('Network error') 
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
      <div className="border-b border-border bg-background sticky top-16 z-40">
        <div className="container py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <SearchBar
                variant="compact"
                initialValue={selectedLocality?.name || ""}
                onSearch={handleSearch}
              />
            </div>

            {/* Sort & Filter */}
            <div className="flex items-center gap-2">
              <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="best-match">Best Match</SelectItem>
                  <SelectItem value="budget-low">Budget: Low → High</SelectItem>
                  <SelectItem value="recently-verified">Recently Verified</SelectItem>
                </SelectContent>
              </Select>

              <FilterDrawer
                filters={filters}
                onChange={handleFilterChange}
                onClear={clearFilters}
              />
            </div>
          </div>

          {/* Active Filters Tags */}
          {hasActiveFilters(filters) && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Filters:</span>
              {filters.locality && (
                <FilterTag
                  label={selectedLocality?.name || filters.locality}
                  onRemove={() => handleFilterChange({ ...filters, locality: "" })}
                />
              )}
              {filters.spaceType && (
                <FilterTag
                  label={filters.spaceType.replace("-", " ")}
                  onRemove={() => handleFilterChange({ ...filters, spaceType: "" })}
                />
              )}
              {filters.budgetBand && (
                <FilterTag
                  label={filters.budgetBand}
                  onRemove={() => handleFilterChange({ ...filters, budgetBand: "" })}
                />
              )}
              {filters.nearMetro && (
                <FilterTag
                  label="Near Metro"
                  onRemove={() => handleFilterChange({ ...filters, nearMetro: false })}
                />
              )}
              {filters.parking && (
                <FilterTag
                  label="Parking"
                  onRemove={() => handleFilterChange({ ...filters, parking: false })}
                />
              )}
              {filters.powerBackup && (
                <FilterTag
                  label="Power Backup"
                  onRemove={() => handleFilterChange({ ...filters, powerBackup: false })}
                />
              )}
              {filters.gstInvoice && (
                <FilterTag
                  label="GST Invoice"
                  onRemove={() => handleFilterChange({ ...filters, gstInvoice: false })}
                />
              )}
              <button
                onClick={clearFilters}
                className="text-sm text-primary hover:underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="container py-8">
        {/* Results Header */}
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-foreground">
            {selectedLocality
              ? `Workspaces in ${selectedLocality.name}`
              : "All Workspaces in Delhi"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </span>
            ) : (
              `${listings.length} ${listings.length === 1 ? "space" : "spaces"} found`
            )}
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted rounded-lg h-48 mb-4"></div>
                <div className="bg-muted rounded h-4 mb-2"></div>
                <div className="bg-muted rounded h-4 w-3/4"></div>
              </div>
            ))}
          </div>
        ) : listings.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard key={listing.slug} listing={listing} />
            ))}
          </div>
        ) : !isLoading ? (
          <EmptyState onClear={clearFilters} filters={filters} />
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No listings available</p>
            <p className="text-sm text-muted-foreground mt-1">
              The backend may not have any listings yet, or there might be a connection issue.
            </p>
          </div>
        )}
      </div>

      {/* Mobile Sticky CTA */}
      <StickyCTA />
    </div>
  );
}

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
      {label}
      <button onClick={onRemove} className="ml-1 hover:text-primary/70">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

function EmptyState({
  onClear,
  filters,
}: {
  onClear: () => void;
  filters: FilterState;
}) {
  const whatsappLink = buildWhatsAppLink({
    locality: filters.locality,
    budgetBand: filters.budgetBand,
    teamSize: filters.teamSize,
    spaceType: filters.spaceType,
  });

  return (
    <div className="py-16 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <SlidersHorizontal className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-display text-xl font-semibold text-foreground">
        No spaces match your filters
      </h3>
      <p className="mt-2 text-muted-foreground">
        Try adjusting your filters or tell us what you're looking for
      </p>
      <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Button variant="outline" onClick={onClear}>
          Clear All Filters
        </Button>
        <Button variant="whatsapp" asChild>
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4" />
            WhatsApp Your Requirements
          </a>
        </Button>
      </div>
    </div>
  );
}
