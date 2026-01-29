import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Shield, Clock, Car, Zap, Wifi, Loader2 } from "lucide-react";
import { LocationData } from "@/types/models";
import { useLocalities } from "@/hooks/useApi";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { GoogleMap } from "@/components/GoogleMap";

interface LocationStepProps {
  data: LocationData;
  onChange: (updates: Partial<LocationData>) => void;
  errors: Record<string, string>;
  disabled?: boolean;
}

const accessHoursOptions = [
  "9 AM - 6 PM",
  "9 AM - 9 PM", 
  "8 AM - 8 PM",
  "24/7 Access",
  "Flexible Hours",
  "Custom Hours"
];

const parkingOptions = [
  { value: "NONE", label: "No Parking Available" },
  { value: "TWO_WHEELER", label: "Two Wheeler Parking" },
  { value: "FOUR_WHEELER", label: "Four Wheeler Parking" },
  { value: "BOTH", label: "Both Two & Four Wheeler" },
  { value: "PAID", label: "Paid Parking Available" },
  { value: "FREE", label: "Free Parking Available" },
];

export function LocationStep({ data, onChange, errors, disabled = false }: LocationStepProps) {
  const { data: localitiesData } = useLocalities();
  const localities = localitiesData?.localities || [];
  const localitiesByCity = localitiesData?.by_city || {};
  const { toast } = useToast();
  
  // Available cities
  const cities = ["Delhi", "Gurugram", "Noida"];
  
  // Get localities for selected city
  const selectedCityLocalities = data.city ? localitiesByCity[data.city] || [] : [];
  
  // State for custom locality
  const [isCustomLocality, setIsCustomLocality] = useState(false);
  const [customLocalityValue, setCustomLocalityValue] = useState("");
  const [isGeocoding, setIsGeocoding] = useState(false);

  const handleInputChange = (field: keyof LocationData, value: any) => {
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

  // Geocode address to get coordinates
  const handleGeocodeAddress = async () => {
    if (!data.exactAddress || !data.exactAddress.trim()) {
      toast({
        title: "Address Required",
        description: "Please enter an address first",
        variant: "destructive",
      });
      return;
    }

    setIsGeocoding(true);

    try {
      // Load Google Maps if not already loaded
      if (!window.google?.maps) {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        
        if (!apiKey) {
          toast({
            title: "API Key Missing",
            description: "Google Maps API key is not configured",
            variant: "destructive",
          });
          setIsGeocoding(false);
          return;
        }

        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
          script.async = true;
          script.defer = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Google Maps'));
          document.head.appendChild(script);
        });
      }

      const geocoder = new window.google.maps.Geocoder();
      
      geocoder.geocode({ address: data.exactAddress }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          const lat = location.lat();
          const lng = location.lng();

          // Round to 2 decimal places for privacy
          const roundedLat = Math.round(lat * 100) / 100;
          const roundedLng = Math.round(lng * 100) / 100;

          handleInputChange('approximateCoordinates', {
            lat: roundedLat,
            lng: roundedLng
          });

          toast({
            title: "Address Geocoded",
            description: `Coordinates: ${roundedLat}, ${roundedLng} (rounded for privacy)`,
          });
        } else {
          toast({
            title: "Geocoding Failed",
            description: "Unable to find coordinates for this address. Please try a more specific address or enter coordinates manually.",
            variant: "destructive",
          });
        }
        setIsGeocoding(false);
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to geocode address. Please try again.",
        variant: "destructive",
      });
      setIsGeocoding(false);
    }
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

  return (
    <div className="space-y-6">
      {/* Privacy Notice */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-blue-900">Location Privacy Protection</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-blue-800">
            We protect your exact location details. Only locality and city information is shown publicly. 
            Exact addresses are shared only after customer enquiries are confirmed.
          </p>
        </CardContent>
      </Card>

      {/* Basic Location Info */}
      <div className="space-y-4">
        <h3 className="font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Location Information
        </h3>

        {/* City */}
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

        {/* Locality - Only show if city is selected */}
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

        {/* Full Address with Auto-Geocoding */}
        <div className="space-y-2">
          <Label htmlFor="exactAddress">
            Full Address (For Internal Use Only)
          </Label>
          <Textarea
            id="exactAddress"
            value={data.exactAddress || ''}
            onChange={(e) => handleInputChange('exactAddress', e.target.value)}
            placeholder="e.g., Sri Aurobindo Marg, Block Q, Green Park Extension, Green Park, New Delhi, Delhi 110016"
            className="min-h-[80px]"
            disabled={disabled}
          />
          <p className="text-xs text-muted-foreground">
            This address will NOT be shown publicly. It's used internally and for generating map location. 
            Only locality will be displayed to customers.
          </p>
        </div>

        {/* Approximate Coordinates (Optional) */}
        <div className="space-y-4">
          <div>
            <Label>Approximate Location (Optional)</Label>
            <p className="text-xs text-muted-foreground mt-1">
              Provide approximate coordinates for better map display. These will be rounded for privacy.
              You can also geocode from the address above.
            </p>
          </div>
          
          {data.exactAddress && (
            <Button
              type="button"
              variant="outline"
              onClick={handleGeocodeAddress}
              disabled={disabled || isGeocoding}
              className="w-full sm:w-auto"
            >
              {isGeocoding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Geocoding...
                </>
              ) : (
                <>
                  <MapPin className="mr-2 h-4 w-4" />
                  Geocode Address
                </>
              )}
            </Button>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="0.000001"
                value={data.approximateCoordinates?.lat || ''}
                onChange={(e) => {
                  const lat = e.target.value ? parseFloat(e.target.value) : undefined;
                  handleInputChange('approximateCoordinates', {
                    ...data.approximateCoordinates,
                    lat
                  });
                }}
                placeholder="e.g., 28.6139"
                disabled={disabled}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="0.000001"
                value={data.approximateCoordinates?.lng || ''}
                onChange={(e) => {
                  const lng = e.target.value ? parseFloat(e.target.value) : undefined;
                  handleInputChange('approximateCoordinates', {
                    ...data.approximateCoordinates,
                    lng
                  });
                }}
                placeholder="e.g., 77.2090"
                disabled={disabled}
              />
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Coordinates will be rounded to 2 decimal places for privacy protection. Use the "Geocode Address" button to automatically get coordinates from your address.
          </p>

          {/* Map Preview */}
          {data.locality && data.city && (data.approximateCoordinates?.lat || data.exactAddress) && (
            <div className="space-y-2">
              <Label>Location Preview</Label>
              <GoogleMap
                locality={data.locality}
                city={data.city}
                approximateCoordinates={data.approximateCoordinates}
              />
              <p className="text-xs text-muted-foreground">
                This is how the location will appear to customers (approximate area, not exact address)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Access Information */}
      <div className="space-y-4">
        <h3 className="font-medium flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Access & Hours
        </h3>

        {/* Access Hours */}
        <div className="space-y-2">
          <Label>Access Hours</Label>
          <Select
            value={data.accessHours || ''}
            onValueChange={(value) => handleInputChange('accessHours', value)}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select access hours" />
            </SelectTrigger>
            <SelectContent>
              {accessHoursOptions.map((hours) => (
                <SelectItem key={hours} value={hours}>
                  {hours}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Custom Hours Input */}
        {data.accessHours === 'Custom Hours' && (
          <div className="space-y-2">
            <Label htmlFor="customHours">Custom Access Hours</Label>
            <Input
              id="customHours"
              value={data.customAccessHours || ''}
              onChange={(e) => handleInputChange('customAccessHours', e.target.value)}
              placeholder="e.g., Mon-Fri: 8 AM - 10 PM, Sat-Sun: 10 AM - 6 PM"
              disabled={disabled}
            />
          </div>
        )}

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

        {/* 24/7 Access */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="twentyFourSevenAccess"
            checked={data.twentyFourSevenAccess || false}
            onCheckedChange={(checked) => handleInputChange('twentyFourSevenAccess', checked)}
            disabled={disabled}
          />
          <Label htmlFor="twentyFourSevenAccess" className="cursor-pointer">
            24/7 Access Available
          </Label>
        </div>
      </div>

      {/* Transportation & Parking */}
      <div className="space-y-4">
        <h3 className="font-medium flex items-center gap-2">
          <Car className="h-4 w-4" />
          Transportation & Parking
        </h3>

        {/* Near Metro */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="nearMetro"
            checked={data.nearMetro || false}
            onCheckedChange={(checked) => handleInputChange('nearMetro', checked)}
            disabled={disabled}
          />
          <Label htmlFor="nearMetro" className="cursor-pointer">
            Near Metro Station
          </Label>
        </div>

        {/* Metro Details */}
        {data.nearMetro && (
          <div className="space-y-2">
            <Label htmlFor="metroDetails">Metro Station Details</Label>
            <Input
              id="metroDetails"
              value={data.metroDetails || ''}
              onChange={(e) => handleInputChange('metroDetails', e.target.value)}
              placeholder="e.g., 2 min walk from Rajiv Chowk Metro Station"
              disabled={disabled}
            />
          </div>
        )}

        {/* Parking */}
        <div className="space-y-2">
          <Label>Parking Availability</Label>
          <Select
            value={data.parking || 'NONE'}
            onValueChange={(value) => handleInputChange('parking', value)}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {parkingOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Parking Notes */}
        {data.parking && data.parking !== 'NONE' && (
          <div className="space-y-2">
            <Label htmlFor="parkingNotes">Parking Notes (Optional)</Label>
            <Textarea
              id="parkingNotes"
              value={data.parkingNotes || ''}
              onChange={(e) => handleInputChange('parkingNotes', e.target.value)}
              placeholder="Additional parking information, rates, restrictions, etc."
              rows={2}
              disabled={disabled}
            />
          </div>
        )}
      </div>

      {/* Infrastructure */}
      <div className="space-y-4">
        <h3 className="font-medium flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Infrastructure
        </h3>

        {/* Power Backup */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="powerBackup"
            checked={data.powerBackup || false}
            onCheckedChange={(checked) => handleInputChange('powerBackup', checked)}
            disabled={disabled}
          />
          <Label htmlFor="powerBackup" className="cursor-pointer">
            Power Backup Available
          </Label>
        </div>

        {/* Internet Speed */}
        <div className="space-y-2">
          <Label htmlFor="internetSpeed">Internet Speed (Mbps)</Label>
          <Input
            id="internetSpeed"
            type="number"
            value={data.internetSpeedMbps || ''}
            onChange={(e) => handleInputChange('internetSpeedMbps', 
              e.target.value ? parseInt(e.target.value) : undefined
            )}
            placeholder="e.g., 100"
            disabled={disabled}
          />
          <p className="text-xs text-muted-foreground">
            Advertised internet speed for the workspace
          </p>
        </div>

        {/* WiFi Details */}
        <div className="space-y-2">
          <Label htmlFor="wifiDetails">WiFi & Connectivity Details</Label>
          <Textarea
            id="wifiDetails"
            value={data.wifiDetails || ''}
            onChange={(e) => handleInputChange('wifiDetails', e.target.value)}
            placeholder="Details about WiFi coverage, ethernet ports, backup connections, etc."
            rows={3}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Additional Information */}
      <div className="space-y-4">
        <h3 className="font-medium">Additional Information</h3>

        {/* House Rules */}
        <div className="space-y-2">
          <Label htmlFor="houseRules">House Rules (Optional)</Label>
          <Textarea
            id="houseRules"
            value={data.houseRules || ''}
            onChange={(e) => handleInputChange('houseRules', e.target.value)}
            placeholder="Any specific rules or guidelines for workspace users..."
            rows={3}
            disabled={disabled}
          />
        </div>

        {/* Special Instructions */}
        <div className="space-y-2">
          <Label htmlFor="specialInstructions">Special Instructions (Optional)</Label>
          <Textarea
            id="specialInstructions"
            value={data.specialInstructions || ''}
            onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
            placeholder="Any special instructions for visitors, access procedures, etc."
            rows={3}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Validation Errors */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <h4 className="font-medium text-destructive mb-2">Please fix the following issues:</h4>
          <ul className="text-sm text-destructive/80 list-disc list-inside space-y-1">
            {Object.entries(errors).map(([field, error]) => (
              <li key={field}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}