import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchBar } from "@/components/SearchBar";
import { FilterDrawer } from "@/components/FilterDrawer";
import { ListingCard } from "@/components/ListingCard";
import { StickyCTA } from "@/components/StickyCTA";
import { listings, WorkspaceType, BudgetBand } from "@/data/listings";
import { localities } from "@/data/localities";
import { FilterState, SortOption, initialFilterState, applyFilters, sortListings, hasActiveFilters } from "@/lib/filters";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<FilterState>(() => {
    const locality = searchParams.get("locality") || "";
    const spaceType = (searchParams.get("type") as WorkspaceType) || "";
    return { ...initialFilterState, locality, spaceType };
  });
  const [sort, setSort] = useState<SortOption>("best-match");

  // Sync URL params with filters
  useEffect(() => {
    const locality = searchParams.get("locality") || "";
    const spaceType = (searchParams.get("type") as WorkspaceType) || "";
    if (locality !== filters.locality || spaceType !== filters.spaceType) {
      setFilters((prev) => ({ ...prev, locality, spaceType }));
    }
  }, [searchParams]);

  const filteredListings = useMemo(() => {
    const filtered = applyFilters(listings, filters);
    return sortListings(filtered, sort);
  }, [filters, sort]);

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
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

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
            {filteredListings.length} {filteredListings.length === 1 ? "space" : "spaces"} found
          </p>
        </div>

        {filteredListings.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredListings.map((listing) => (
              <ListingCard key={listing.slug} listing={listing} />
            ))}
          </div>
        ) : (
          <EmptyState onClear={clearFilters} filters={filters} />
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
