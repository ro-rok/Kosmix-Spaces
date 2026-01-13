import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { BasicInfoData, PhotoData } from "@/types/models";
import { useLocalities, useUploadPhoto, useDeletePhoto } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Loader2, Plus, Check, AlertCircle, Upload, X } from "lucide-react";
import { toast } from "sonner";

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
  const { data: localitiesData, refetch: refetchLocalities } = useLocalities();
  const localities = localitiesData?.localities || [];
  const localitiesByCity = localitiesData?.by_city || {};
  
  // Available cities
  const cities = ["Delhi", "Gurugram", "Noida"];
  
  // Get localities for selected city
  const selectedCityLocalities = data.city ? localitiesByCity[data.city] || [] : [];
  
  // State for custom locality
  const [isCustomLocality, setIsCustomLocality] = useState(false);
  const [customLocalityValue, setCustomLocalityValue] = useState("");
  const [isAddingLocality, setIsAddingLocality] = useState(false);
  const [localitySubmissionStatus, setLocalitySubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  // Photo upload hooks
  const uploadPhotoMutation = useUploadPhoto();
  const deletePhotoMutation = useDeletePhoto();
  const [uploadingPhotos, setUploadingPhotos] = useState<Record<string, boolean>>({});

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

  const handleAddLocality = async () => {
    if (!customLocalityValue.trim() || !data.city) {
      toast.error("Please enter a locality name");
      return;
    }

    setLocalitySubmissionStatus('submitting');
    
    try {
      // Map city names to city IDs
      const cityIdMap: Record<string, string> = {
        "Delhi": "delhi",
        "Gurugram": "gurugram", 
        "Noida": "noida"
      };

      const result = await api.partner.addLocality({
        name: customLocalityValue.trim(),
        cityId: cityIdMap[data.city],
        metroConnected: false, // Default to false, can be updated by admin
      });

      setLocalitySubmissionStatus('success');
      toast.success("Locality submitted for review! It will be available after admin approval.");
      
      // Keep the custom locality selected for now
      handleInputChange('locality', customLocalityValue.trim());
      
      // Refresh localities data to potentially show the new locality
      setTimeout(() => {
        refetchLocalities();
      }, 1000);

    } catch (error: any) {
      setLocalitySubmissionStatus('error');
      console.error("Failed to add locality:", error);
      
      if (error.message?.includes("already exists")) {
        toast.error("This locality already exists in the selected city");
      } else {
        toast.error("Failed to add locality. Please try again.");
      }
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

  const toggleAmenity = (amenity: string) => {
    if (disabled) return;
    
    const currentAmenities = data.amenities || [];
    const newAmenities = currentAmenities.includes(amenity)
      ? currentAmenities.filter(a => a !== amenity)
      : [...currentAmenities, amenity];
    
    onChange({ amenities: newAmenities });
  };

  // Hero photo upload functionality
  const handleHeroPhotoUpload = async (files: FileList) => {
    if (disabled) return;

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum size is 10MB`);
        continue;
      }

      const uploadKey = `hero-${file.name}`;
      setUploadingPhotos(prev => ({ ...prev, [uploadKey]: true }));

      try {
        // Upload as hero photo (no offering type)
        const result = await uploadPhotoMutation.mutateAsync({ file });
        
        // Add photo to hero photos
        const currentPhotos = data.heroPhotos || [];
        onChange({ heroPhotos: [...currentPhotos, result.photo] });
        
        toast.success(`Hero photo uploaded`);
      } catch (error: any) {
        toast.error(`Failed to upload ${file.name}: ${error.message}`);
      } finally {
        setUploadingPhotos(prev => ({ ...prev, [uploadKey]: false }));
      }
    }
  };

  // Remove hero photo
  const removeHeroPhoto = async (photoIndex: number) => {
    if (disabled) return;

    const photos = data.heroPhotos || [];
    const photo = photos[photoIndex];
    if (!photo) return;

    try {
      await deletePhotoMutation.mutateAsync(photo.publicId);
      const updatedPhotos = photos.filter((_, i) => i !== photoIndex);
      onChange({ heroPhotos: updatedPhotos });
      toast.success('Hero photo removed');
    } catch (error: any) {
      toast.error(`Failed to remove photo: ${error.message}`);
    }
  };

  const isUploadingHeroPhotos = Object.keys(uploadingPhotos).some(key => 
    key.startsWith('hero-') && uploadingPhotos[key]
  );

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
            <div className="space-y-3">
              <Label htmlFor="customLocality">
                Enter locality name
              </Label>
              <div className="flex gap-2">
                <Input
                  id="customLocality"
                  value={customLocalityValue}
                  onChange={(e) => handleCustomLocalityChange(e.target.value)}
                  placeholder={`Enter locality name in ${data.city}`}
                  className={cn(errors.locality && "border-destructive")}
                  disabled={disabled || localitySubmissionStatus === 'submitting'}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddLocality}
                  disabled={disabled || !customLocalityValue.trim() || localitySubmissionStatus === 'submitting'}
                  className="shrink-0"
                >
                  {localitySubmissionStatus === 'submitting' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : localitySubmissionStatus === 'success' ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {localitySubmissionStatus === 'submitting' ? 'Adding...' : 
                   localitySubmissionStatus === 'success' ? 'Added' : 'Add'}
                </Button>
              </div>
              
              {localitySubmissionStatus === 'success' ? (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  <span>Locality submitted for admin review</span>
                </div>
              ) : localitySubmissionStatus === 'error' ? (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>Failed to add locality. Please try again.</span>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  This will be reviewed by our team before being added to the system
                </p>
              )}
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

      {/* Hero Photos */}
      <div className="space-y-4">
        <div>
          <Label>Hero Photos (Optional)</Label>
          <p className="text-xs text-muted-foreground mt-1">
            Upload main photos that represent your workspace. If no hero photos are uploaded, we'll use photos from your offerings.
          </p>
        </div>

        {/* Photo upload */}
        {!disabled && (
          <div>
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                if (e.target.files) handleHeroPhotoUpload(e.target.files);
              }}
              className="hidden"
              id="hero-photo-upload"
            />
            <Label
              htmlFor="hero-photo-upload"
              className={cn(
                "flex items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                "hover:bg-muted border-muted-foreground/25 hover:border-muted-foreground/50",
                isUploadingHeroPhotos && "opacity-50 cursor-not-allowed"
              )}
            >
              <Upload className="h-5 w-5" />
              {isUploadingHeroPhotos ? 'Uploading...' : 'Upload Hero Photos'}
            </Label>
          </div>
        )}

        {/* Photo grid */}
        {data.heroPhotos && data.heroPhotos.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {data.heroPhotos.map((photo, index) => (
              <div key={index} className="relative group">
                <img
                  src={photo.url}
                  alt={`Hero photo ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border"
                />
                {!disabled && (
                  <button
                    onClick={() => removeHeroPhoto(index)}
                    className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          {data.heroPhotos?.length || 0} hero photo(s) uploaded
        </p>
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