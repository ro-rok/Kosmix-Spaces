import { useState } from "react";
import { Filter, X, Train, Car, Zap, FileText, MapPin, Users, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
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
  const localities = localitiesData || [];

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

  // Convert localities to options format
  const localityOptions = localities.map(loc => ({
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
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filters
          {activeCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="font-display">Filters</SheetTitle>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={onClear}>
                Clear all
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Locality Multi-Select */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
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
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
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
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Size
            </Label>
            <Select
              value={filters.teamSize}
              onValueChange={(value) => updateFilter("teamSize", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any size</SelectItem>
                {teamSizeBands.map((band) => (
                  <SelectItem key={band.value} value={band.value}>
                    {band.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amenities Multi-Select */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Amenities</Label>
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
          <div className="space-y-4 rounded-lg bg-muted/50 p-4">
            <h4 className="text-sm font-medium">Quick Filters</h4>
            
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
                <Zap className="h-4 w-4 text-muted-foreground" />
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
            className="w-full"
            size="lg"
            onClick={() => setOpen(false)}
          >
            Apply Filters ({activeCount} active)
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
