import { useState } from "react";
import { Filter, X, Train, Car, Zap, FileText, MapPin, Users, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelectFilter } from "@/components/MultiSelectFilter";
import { useLocalities } from "@/hooks/useApi";
import { budgetBandLabels, teamSizeBands, SearchFilters } from "@/types/models";

interface FilterDrawerProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  onClear: () => void;
}

// Common amenities for multi-select
const commonAmenities = [
  { value: 'wifi', label: 'High-Speed WiFi' },
  { value: 'parking', label: 'Parking' },
  { value: 'cafeteria', label: 'Cafeteria' },
  { value: 'printer', label: 'Printer/Scanner' },
  { value: 'reception', label: '24/7 Reception' },
  { value: 'security', label: 'Security' },
  { value: 'cleaning', label: 'Housekeeping' },
  { value: 'lounge', label: 'Lounge Area' },
  { value: 'phone-booth', label: 'Phone Booths' },
  { value: 'lockers', label: 'Lockers' },
];

export function FilterDrawer({ filters, onChange, onClear }: FilterDrawerProps) {
  const [open, setOpen] = useState(false);
  
  const { data: localitiesData } = useLocalities();
  const localities = localitiesData?.localities || localitiesData?.flat || [];

  // Count active filters
  const activeCount = [
    ...filters.locality,
    ...filters.budgetBand,
    filters.teamSize,
    ...filters.amenities,
    filters.meetingRooms,
    filters.privateOffice,
    filters.verifiedOnly
  ].filter(Boolean).length;

  const updateFilter = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    onChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = activeCount > 0;

  // Convert localities to options format, filtered by selected cities
  const localityOptions = localities
    .filter(loc => filters.city.includes(loc.city))
    .map(loc => ({
      value: loc.id,
      label: loc.name
    }));

  // Convert budget bands to options format
  const budgetOptions = Object.entries(budgetBandLabels).map(([value, label]) => ({
    value,
    label
  }));

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2 btn-premium">
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
          {activeCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground animate-scale-in">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto glass">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="font-display text-xl">Filters</SheetTitle>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={onClear} className="btn-premium">
                Clear all
              </Button>
            )}
          </div>
          <SheetDescription>
            Refine your search results by selecting specific criteria below.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* City Multi-Select */}
          <div className="space-y-3 animate-slide-up" style={{ animationDelay: '0.05s' }}>
            <Label className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Cities
            </Label>
            <MultiSelectFilter
              options={[
                { value: 'Delhi', label: 'Delhi' },
                { value: 'Noida', label: 'Noida' },
                { value: 'Gurugram', label: 'Gurugram' }
              ]}
              value={filters.city}
              onChange={(value) => updateFilter("city", value.length > 0 ? value : ['Delhi', 'Noida', 'Gurugram'])}
              placeholder="Delhi NCR"
              searchPlaceholder="Search cities..."
              className="w-full"
            />
          </div>

          {/* Locality Multi-Select */}
          <div className="space-y-3 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <Label className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Localities
            </Label>
            <MultiSelectFilter
              options={localityOptions}
              value={filters.locality}
              onChange={(value) => updateFilter("locality", value)}
              placeholder="All localities"
              searchPlaceholder="Search localities..."
              className="w-full"
            />
          </div>

          {/* Budget Band Multi-Select */}
          <div className="space-y-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Label className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Budget Range
            </Label>
            <MultiSelectFilter
              options={budgetOptions}
              value={filters.budgetBand}
              onChange={(value) => updateFilter("budgetBand", value)}
              placeholder="Any budget"
              searchPlaceholder="Search budget ranges..."
              className="w-full"
            />
          </div>

          {/* Team Size */}
          <div className="space-y-3 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <Label className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Team Size
            </Label>
            <Select
              value={filters.teamSize || "all"}
              onValueChange={(value) => updateFilter("teamSize", value === "all" ? "" : value)}
            >
              <SelectTrigger className="btn-premium">
                <SelectValue placeholder="Any size" />
              </SelectTrigger>
              <SelectContent className="glass">
                <SelectItem value="all">Any size</SelectItem>
                {teamSizeBands.map((band) => (
                  <SelectItem key={band.value} value={band.value}>
                    {band.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amenities Multi-Select */}
          <div className="space-y-3 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <Label className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Amenities
            </Label>
            <MultiSelectFilter
              options={commonAmenities}
              value={filters.amenities}
              onChange={(value) => updateFilter("amenities", value)}
              placeholder="Select amenities"
              searchPlaceholder="Search amenities..."
              className="w-full"
              maxDisplay={3}
            />
          </div>

          {/* Quick Filters */}
          <div className="space-y-4 card-premium p-4 animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <h4 className="text-sm font-medium font-display">Quick Filters</h4>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Train className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="meetingRooms" className="text-sm">
                  Meeting Rooms Available
                </Label>
              </div>
              <Switch
                id="meetingRooms"
                checked={filters.meetingRooms}
                onCheckedChange={(checked) => updateFilter("meetingRooms", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="privateOffice" className="text-sm">
                  Private Office Available
                </Label>
              </div>
              <Switch
                id="privateOffice"
                checked={filters.privateOffice}
                onCheckedChange={(checked) => updateFilter("privateOffice", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="verifiedOnly" className="text-sm">
                  Verified Only
                </Label>
              </div>
              <Switch
                id="verifiedOnly"
                checked={filters.verifiedOnly}
                onCheckedChange={(checked) => updateFilter("verifiedOnly", checked)}
              />
            </div>
          </div>

          {/* Apply Button */}
          <Button
            className="w-full btn-premium animate-slide-up"
            size="lg"
            onClick={() => setOpen(false)}
            style={{ animationDelay: '0.6s' }}
          >
            Apply Filters ({activeCount} active)
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
