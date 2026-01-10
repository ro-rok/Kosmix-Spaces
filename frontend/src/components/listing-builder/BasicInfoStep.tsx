import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { BasicInfoData } from "@/types/models";
import { useLocalities } from "@/hooks/useApi";
import { cn } from "@/lib/utils";

interface BasicInfoStepProps {
  data: BasicInfoData;
  onChange: (updates: Partial<BasicInfoData>) => void;
  errors: Record<string, string>;
  disabled?: boolean;
}

const commonAmenities = [
  "High-speed WiFi",
  "Cafeteria", 
  "Printer/Scanner",
  "Reception",
  "Housekeeping",
  "Lounge Area",
  "Phone Booth",
  "Conference Room",
  "Security",
  "Gym Access",
  "Terrace",
  "Pantry",
  "Natural Light",
  "Outdoor Seating",
  "Air Conditioning",
  "Power Backup",
  "Parking",
  "Near Metro Station",
  "Tea/Coffee",
  "Lockers",
  "Mail Handling",
  "Onsite Staff",
  "Cleaning Services",
  "Micro-Roasted Coffee",
  "Lift Access",
  "Unique Common Areas",
  "CCTV Cameras",
];

export function BasicInfoStep({ data, onChange, errors, disabled = false }: BasicInfoStepProps) {
  const { data: localitiesData } = useLocalities();
  const localities = localitiesData?.localities || [];
  const localitiesByCity = localitiesData?.by_city || {};
  
  // Available cities
  const cities = ["Delhi", "Gurugram", "Noida"];
  
  // Get localities for selected city
  const selectedCityLocalities = data.city ? localitiesByCity[data.city] || [] : [];
  
  // State for custom locality
  const [isCustomLocality, setIsCustomLocality] = useState(false);
  const [customLocalityValue, setCustomLocalityValue] = useState("");

  const handleInputChange = (field: keyof BasicInfoData, value: any) => {
    onChange({ [field]: value });
  };

  const handleLocalityChange = (value: string) => {
    if (value === "custom") {
      setIsCustomLocality(true);
      setCustomLocalityValue("");
      handleInputChange('locality', '');
    } else {
      setIsCustomLocality(false);
      setCustomLocalityValue("");
      handleInputChange('locality', value);
    }
  };

  const handleCustomLocalityChange = (value: string) => {
    setCustomLocalityValue(value);
    handleInputChange('locality', value);
  };

  // Initialize custom locality state based on existing data
  useEffect(() => {
    if (data.locality && data.city) {
      const existingLocality = selectedCityLocalities.find(loc => loc.name === data.locality);
      if (!existingLocality && data.locality) {
        setIsCustomLocality(true);
        setCustomLocalityValue(data.locality);
      }
    }
  }, [data.locality, data.city, selectedCityLocalities]);

  const toggleAmenity = (amenity: string) => {
    if (disabled) return;
    
    const currentAmenities = data.amenities || [];
    const newAmenities = currentAmenities.includes(amenity)
      ? currentAmenities.filter(a => a !== amenity)
      : [...currentAmenities, amenity];
    
    onChange({ amenities: newAmenities });
  };

  return (
    <div className="space-y-6">
      {/* Display Name */}
      <div className="space-y-2">
        <Label htmlFor="displayName">
          Workspace Name *
        </Label>
        <Input
          id="displayName"
          value={data.displayName}
          onChange={(e) => handleInputChange('displayName', e.target.value)}
          placeholder="e.g., Premium Workspace in Connaught Place"
          className={cn(errors.displayName && "border-destructive")}
          disabled={disabled}
        />
        {errors.displayName && (
          <p className="text-xs text-destructive">{errors.displayName}</p>
        )}
        <p className="text-xs text-muted-foreground">
          This will be the main title shown to customers
        </p>
      </div>

      {/* City Selection */}
      <div className="space-y-2">
        <Label htmlFor="city">
          City *
        </Label>
        <Select
          value={data.city}
          onValueChange={(value) => {
            handleInputChange('city', value);
            // Clear locality when city changes
            handleInputChange('locality', '');
            // Reset custom locality state
            setIsCustomLocality(false);
            setCustomLocalityValue("");
          }}
          disabled={disabled}
        >
          <SelectTrigger className={cn(errors.city && "border-destructive")}>
            <SelectValue placeholder="Select city" />
          </SelectTrigger>
          <SelectContent>
            {cities.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.city && (
          <p className="text-xs text-destructive">{errors.city}</p>
        )}
      </div>

      {/* Locality Selection - Only show if city is selected */}
      {data.city && (
        <div className="space-y-2">
          <Label htmlFor="locality">
            Locality *
          </Label>
          <Select
            value={isCustomLocality ? "custom" : data.locality}
            onValueChange={handleLocalityChange}
            disabled={disabled}
          >
            <SelectTrigger className={cn(errors.locality && "border-destructive")}>
              <SelectValue placeholder={`Select locality in ${data.city}`} />
            </SelectTrigger>
            <SelectContent>
              {selectedCityLocalities.map((locality) => (
                <SelectItem key={locality.id} value={locality.name}>
                  {locality.name}
                  {locality.popular && (
                    <span className="ml-2 text-xs text-primary">Popular</span>
                  )}
                </SelectItem>
              ))}
              <SelectItem value="custom" className="border-t border-border mt-1 pt-2">
                <span className="flex items-center gap-2">
                  <span>+ Add custom locality</span>
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
          {errors.locality && (
            <p className="text-xs text-destructive">{errors.locality}</p>
          )}
          
          {/* Custom locality input */}
          {isCustomLocality && (
            <div className="space-y-2">
              <Label htmlFor="customLocality">
                Enter locality name
              </Label>
              <Input
                id="customLocality"
                value={customLocalityValue}
                onChange={(e) => handleCustomLocalityChange(e.target.value)}
                placeholder={`Enter locality name in ${data.city}`}
                className={cn(errors.locality && "border-destructive")}
                disabled={disabled}
              />
              <p className="text-xs text-muted-foreground">
                This will be reviewed by our team before being added to the system
              </p>
            </div>
          )}
        </div>
      )}

      {/* Overview */}
      <div className="space-y-2">
        <Label htmlFor="overview">
          Overview *
        </Label>
        <Textarea
          id="overview"
          value={data.overview}
          onChange={(e) => handleInputChange('overview', e.target.value)}
          placeholder="Describe your workspace, its unique features, and what makes it special..."
          rows={4}
          maxLength={500}
          className={cn(errors.overview && "border-destructive")}
          disabled={disabled}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Minimum 10 characters required</span>
          <span>{data.overview.length}/500 characters</span>
        </div>
        {errors.overview && (
          <p className="text-xs text-destructive">{errors.overview}</p>
        )}
      </div>

      {/* Access Hours */}
      <div className="space-y-2">
        <Label htmlFor="accessHours">
          Access Hours
        </Label>
        <Input
          id="accessHours"
          value={data.accessHours || ''}
          onChange={(e) => handleInputChange('accessHours', e.target.value)}
          placeholder="e.g., 9 AM - 9 PM or 24/7 Access"
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          When can members access the workspace?
        </p>
      </div>

      {/* Weekend Access */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="weekendAccess"
          checked={data.weekendAccess || false}
          onCheckedChange={(checked) => handleInputChange('weekendAccess', checked)}
          disabled={disabled}
        />
        <Label htmlFor="weekendAccess" className="cursor-pointer">
          Weekend Access Available
        </Label>
      </div>

      {/* Amenities */}
      <div className="space-y-4">
        <div>
          <Label>Amenities *</Label>
          <p className="text-xs text-muted-foreground mt-1">
            Select all amenities available at your workspace
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {commonAmenities.map((amenity) => (
            <div key={amenity} className="flex items-center space-x-2">
              <Checkbox
                id={`amenity-${amenity}`}
                checked={data.amenities?.includes(amenity) || false}
                onCheckedChange={() => toggleAmenity(amenity)}
                disabled={disabled}
              />
              <Label 
                htmlFor={`amenity-${amenity}`} 
                className={cn(
                  "cursor-pointer text-sm",
                  disabled && "cursor-not-allowed opacity-50"
                )}
              >
                {amenity}
              </Label>
            </div>
          ))}
        </div>
        
        {errors.amenities && (
          <p className="text-xs text-destructive">{errors.amenities}</p>
        )}
        
        <p className="text-xs text-muted-foreground">
          Selected: {data.amenities?.length || 0} amenities
        </p>
      </div>
    </div>
  );
}