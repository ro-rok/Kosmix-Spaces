import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchFilters, budgetBandLabels, teamSizeBands } from '@/types/models';
import { useLocalities } from '@/hooks/useApi';

interface AppliedFiltersProps {
  filters: SearchFilters;
  onRemoveFilter: (filterType: keyof SearchFilters, value?: string) => void;
  onClearAll: () => void;
  className?: string;
}

export function AppliedFilters({
  filters,
  onRemoveFilter,
  onClearAll,
  className
}: AppliedFiltersProps) {
  const { data: localitiesData } = useLocalities();
  const localities = localitiesData?.localities || localitiesData?.flat || [];

  // Count total active filters (excluding default Delhi NCR)
  const isDefaultDelhiNCR = filters.city.length === 3 && 
    filters.city.includes('Delhi') && 
    filters.city.includes('Noida') && 
    filters.city.includes('Gurugram');
    
  const activeFilters = [
    // Only include city filters if they're different from default Delhi NCR
    ...(isDefaultDelhiNCR ? [] : filters.city),
    ...filters.locality,
    ...filters.budgetBand,
    filters.teamSize,
    ...filters.amenities,
    filters.meetingRooms,
    filters.privateOffice,
    filters.verifiedOnly
  ].filter(Boolean);

  if (activeFilters.length === 0) return null;

  // Helper to get locality name by ID
  const getLocalityName = (id: string) => {
    const locality = localities.find(l => l.id === id);
    return locality?.name || id;
  };

  // Helper to get team size label
  const getTeamSizeLabel = (value: string) => {
    const band = teamSizeBands.find(b => b.value === value);
    return band?.label || value;
  };

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          Active filters:
        </span>

        {/* City filters (only show if not default Delhi NCR) */}
        {!isDefaultDelhiNCR && filters.city.map((city) => (
          <FilterChip
            key={`city-${city}`}
            label={city}
            onRemove={() => onRemoveFilter('city', city)}
          />
        ))}

        {/* Locality filters */}
        {filters.locality.map((localityId) => (
          <FilterChip
            key={`locality-${localityId}`}
            label={getLocalityName(localityId)}
            onRemove={() => onRemoveFilter('locality', localityId)}
          />
        ))}

        {/* Budget band filters */}
        {filters.budgetBand.map((budget) => (
          <FilterChip
            key={`budget-${budget}`}
            label={budgetBandLabels[budget as keyof typeof budgetBandLabels] || budget}
            onRemove={() => onRemoveFilter('budgetBand', budget)}
          />
        ))}

        {/* Team size filter */}
        {filters.teamSize && (
          <FilterChip
            label={getTeamSizeLabel(filters.teamSize)}
            onRemove={() => onRemoveFilter('teamSize')}
          />
        )}

        {/* Amenity filters */}
        {filters.amenities.map((amenity) => (
          <FilterChip
            key={`amenity-${amenity}`}
            label={amenity.charAt(0).toUpperCase() + amenity.slice(1).replace('-', ' ')}
            onRemove={() => onRemoveFilter('amenities', amenity)}
          />
        ))}

        {/* Boolean filters */}
        {filters.meetingRooms && (
          <FilterChip
            label="Meeting Rooms"
            onRemove={() => onRemoveFilter('meetingRooms')}
          />
        )}

        {filters.privateOffice && (
          <FilterChip
            label="Private Office"
            onRemove={() => onRemoveFilter('privateOffice')}
          />
        )}

        {filters.verifiedOnly && (
          <FilterChip
            label="Verified Only"
            onRemove={() => onRemoveFilter('verifiedOnly')}
          />
        )}

        {/* Clear all button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-primary hover:text-primary/80 h-auto p-1"
        >
          Clear all ({activeFilters.length})
        </Button>
      </div>
    </div>
  );
}

interface FilterChipProps {
  label: string;
  onRemove: () => void;
}

function FilterChip({ label, onRemove }: FilterChipProps) {
  return (
    <Badge
      variant="secondary"
      className="gap-1 pr-1 hover:bg-secondary/80 transition-colors"
    >
      {label}
      <Button
        variant="ghost"
        size="sm"
        className="h-auto p-0.5 hover:bg-transparent"
        onClick={onRemove}
      >
        <X className="h-3 w-3" />
      </Button>
    </Badge>
  );
}