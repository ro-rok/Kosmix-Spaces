import { Search, MessageCircle, RotateCcw, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchFilters } from '@/types/models';
import { buildWhatsAppLink } from '@/lib/whatsapp';

interface SearchEmptyStateProps {
  filters: SearchFilters;
  searchQuery?: string;
  onClearFilters: () => void;
  onSuggestedSearch?: (locality: string) => void;
  className?: string;
}

// Popular localities for suggestions
const suggestedLocalities = [
  { id: 'connaught-place', name: 'Connaught Place' },
  { id: 'gurgaon', name: 'Gurgaon' },
  { id: 'noida', name: 'Noida' },
  { id: 'south-delhi', name: 'South Delhi' },
  { id: 'dwarka', name: 'Dwarka' },
  { id: 'lajpat-nagar', name: 'Lajpat Nagar' },
];

export function SearchEmptyState({
  filters,
  searchQuery,
  onClearFilters,
  onSuggestedSearch,
  className
}: SearchEmptyStateProps) {
  // Check if any filters are active
  const hasActiveFilters = [
    ...filters.locality,
    ...filters.budgetBand,
    filters.teamSize,
    ...filters.amenities,
    filters.meetingRooms,
    filters.privateOffice,
    filters.verifiedOnly
  ].some(Boolean);

  // Build WhatsApp link with current search context
  const whatsappLink = buildWhatsAppLink({
    locality: filters.locality.join(', '),
    budgetBand: filters.budgetBand.join(', '),
    teamSize: filters.teamSize,
    searchQuery,
  });

  return (
    <div className={className}>
      <div className="py-16 text-center max-w-md mx-auto">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted/50">
          <Search className="h-10 w-10 text-muted-foreground" />
        </div>

        {/* Title and Description */}
        <h3 className="font-display text-xl font-semibold text-foreground mb-2">
          {searchQuery 
            ? `No results for "${searchQuery}"`
            : hasActiveFilters 
            ? "No spaces match your filters"
            : "No workspaces found"
          }
        </h3>
        
        <p className="text-muted-foreground mb-6">
          {hasActiveFilters 
            ? "Try adjusting your filters or search in different areas"
            : "Try searching in popular localities or tell us what you're looking for"
          }
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          {hasActiveFilters && (
            <Button 
              variant="outline" 
              onClick={onClearFilters}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Clear All Filters
            </Button>
          )}
          
          <Button 
            variant="whatsapp" 
            asChild
            className="gap-2"
          >
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" />
              WhatsApp Your Requirements
            </a>
          </Button>
        </div>

        {/* Suggested Localities */}
        {!hasActiveFilters && onSuggestedSearch && (
          <div className="mt-8">
            <p className="text-sm font-medium text-muted-foreground mb-3">
              Try searching in popular areas:
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestedLocalities.map((locality) => (
                <Button
                  key={locality.id}
                  variant="outline"
                  size="sm"
                  onClick={() => onSuggestedSearch(locality.id)}
                  className="gap-1"
                >
                  <MapPin className="h-3 w-3" />
                  {locality.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-8 p-4 bg-muted/30 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Can't find what you're looking for?</strong>
            <br />
            Our team can help you find the perfect workspace. 
            WhatsApp us with your requirements and we'll get back to you within 2 hours.
          </p>
        </div>
      </div>
    </div>
  );
}