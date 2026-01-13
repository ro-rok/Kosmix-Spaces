import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  X, 
  Plus, 
  Minus, 
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { 
  OfferingType, 
  OfferingFormData, 
  offeringTypeLabels,
  PhotoData
} from "@/types/models";
import { 
  updateOffering, 
  toggleOfferingEnabled 
} from "@/lib/offerings";
import { useUploadPhoto, useDeletePhoto } from "@/hooks/useAuth";

interface OfferingsStepProps {
  data: Record<OfferingType, OfferingFormData>;
  onChange: (offerings: Record<OfferingType, OfferingFormData>) => void;
  errors: Record<string, string>;
  disabled?: boolean;
  listingId?: string;
  onSaveListing?: () => Promise<void>;
}

const offeringTypes: OfferingType[] = [
  'private-offices',
  'dedicated-desks', 
  'hot-desks',
  'meeting-rooms',
  'event-spaces'
];

const commonFeatures: Record<OfferingType, string[]> = {
  'private-offices': [
    'Fully furnished', 'Air conditioning', 'Natural light', 'Lockable door',
    'Whiteboard', 'Storage space', 'Phone line', 'Ethernet port'
  ],
  'dedicated-desks': [
    'Ergonomic chair', 'Monitor mount', 'Personal storage', 'Power outlets',
    'Desk lamp', 'Cable management', 'Adjustable height', 'Privacy screen'
  ],
  'hot-desks': [
    'Flexible seating', 'Power outlets', 'WiFi access', 'Shared amenities',
    'Daily cleaning', 'Booking system', 'Mobile app', 'Community access'
  ],
  'meeting-rooms': [
    'Video conferencing', 'Projector/TV', 'Whiteboard', 'Conference phone',
    'Air conditioning', 'Sound proofing', 'Flexible seating', 'Catering options'
  ],
  'event-spaces': [
    'AV equipment', 'Stage/podium', 'Flexible layout', 'Catering kitchen',
    'Sound system', 'Lighting control', 'Parking available', 'Event support'
  ]
};

export function OfferingsStep({ 
  data, 
  onChange, 
  errors, 
  disabled = false
}: OfferingsStepProps) {
  const [expandedOffering, setExpandedOffering] = useState<OfferingType | null>('private-offices');
  const [uploadingPhotos, setUploadingPhotos] = useState<Record<string, boolean>>({});
  
  const uploadPhotoMutation = useUploadPhoto();
  const deletePhotoMutation = useDeletePhoto();

  const updateOfferingData = (type: OfferingType, updates: Partial<OfferingFormData>) => {
    const updatedOfferings = updateOffering(data, type, updates);
    onChange(updatedOfferings);
  };

  const toggleOffering = (type: OfferingType) => {
    if (disabled) return;
    const updatedOfferings = toggleOfferingEnabled(data, type);
    onChange(updatedOfferings);
  };

  const addFeature = (type: OfferingType, feature: string) => {
    if (disabled) return;
    const currentFeatures = data[type].features || [];
    if (!currentFeatures.includes(feature)) {
      updateOfferingData(type, { features: [...currentFeatures, feature] });
    }
  };

  const removeFeature = (type: OfferingType, feature: string) => {
    if (disabled) return;
    const currentFeatures = data[type].features || [];
    updateOfferingData(type, { features: currentFeatures.filter(f => f !== feature) });
  };

  // Simple photo upload - uploads to Cloudinary, stores URL in form state
  const handlePhotoUpload = async (type: OfferingType, files: FileList) => {
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

      const uploadKey = `${type}-${file.name}`;
      setUploadingPhotos(prev => ({ ...prev, [uploadKey]: true }));

      try {
        const result = await uploadPhotoMutation.mutateAsync({ file, offeringType: type });
        
        // Add photo URL to form state
        const currentPhotos = data[type].photos || [];
        updateOfferingData(type, { photos: [...currentPhotos, result.photo] });
        
        toast.success(`Photo uploaded for ${offeringTypeLabels[type]}`);
      } catch (error: any) {
        toast.error(`Failed to upload ${file.name}: ${error.message}`);
      } finally {
        setUploadingPhotos(prev => ({ ...prev, [uploadKey]: false }));
      }
    }
  };

  // Remove photo from form state and Cloudinary
  const removePhoto = async (type: OfferingType, photoIndex: number) => {
    if (disabled) return;

    const photos = data[type].photos || [];
    const photo = photos[photoIndex];
    if (!photo) return;

    try {
      await deletePhotoMutation.mutateAsync(photo.publicId);
      updateOfferingData(type, { photos: photos.filter((_, i) => i !== photoIndex) });
      toast.success('Photo removed');
    } catch (error: any) {
      toast.error(`Failed to remove photo: ${error.message}`);
    }
  };

  const getOfferingValidation = (type: OfferingType) => {
    const offering = data[type];
    const issues: string[] = [];

    if (offering.enabled) {
      if ((offering.photos?.length || 0) === 0) {
        issues.push('At least 1 photo required');
      }
      if (!offering.description?.trim()) {
        issues.push('Description required');
      }
      if (!offering.capacity?.min || !offering.capacity?.max) {
        issues.push('Capacity range required');
      }
      if (offering.capacity?.min && offering.capacity?.max && offering.capacity.min > offering.capacity.max) {
        issues.push('Min capacity cannot be greater than max capacity');
      }
    }

    return { isValid: issues.length === 0, issues };
  };

  const renderOfferingCard = (type: OfferingType) => {
    const offering = data[type];
    const isExpanded = expandedOffering === type;
    const validation = getOfferingValidation(type);
    const isUploading = Object.keys(uploadingPhotos).some(key => 
      key.startsWith(type) && uploadingPhotos[key]
    );

    return (
      <Card key={type} className={cn(
        "transition-all duration-200",
        offering.enabled && "ring-2 ring-primary/20",
        !validation.isValid && offering.enabled && "ring-destructive/20"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Switch
                checked={offering.enabled}
                onCheckedChange={() => toggleOffering(type)}
                disabled={disabled}
              />
              <div>
                <CardTitle className="text-lg">{offeringTypeLabels[type]}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {offering.enabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {offering.enabled && (
                <Badge variant={validation.isValid ? "default" : "destructive"}>
                  {validation.isValid ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : (
                    <AlertCircle className="h-3 w-3 mr-1" />
                  )}
                  {validation.isValid ? 'Ready' : `${validation.issues.length} issues`}
                </Badge>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandedOffering(isExpanded ? null : type)}
                disabled={!offering.enabled}
              >
                {isExpanded ? 'Collapse' : 'Configure'}
              </Button>
            </div>
          </div>
        </CardHeader>

        {isExpanded && offering.enabled && (
          <CardContent className="space-y-6">
            {/* Description */}
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                value={offering.description || ''}
                onChange={(e) => updateOfferingData(type, { description: e.target.value })}
                placeholder={`Describe your ${offeringTypeLabels[type].toLowerCase()}...`}
                rows={3}
                disabled={disabled}
              />
            </div>

            {/* Features */}
            <div className="space-y-3">
              <Label>Features</Label>
              <div className="flex flex-wrap gap-2">
                {commonFeatures[type].map((feature) => (
                  <Button
                    key={feature}
                    variant={offering.features?.includes(feature) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      if (offering.features?.includes(feature)) {
                        removeFeature(type, feature);
                      } else {
                        addFeature(type, feature);
                      }
                    }}
                    disabled={disabled}
                  >
                    {offering.features?.includes(feature) ? (
                      <Minus className="h-3 w-3 mr-1" />
                    ) : (
                      <Plus className="h-3 w-3 mr-1" />
                    )}
                    {feature}
                  </Button>
                ))}
              </div>
            </div>

            {/* Capacity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Capacity</Label>
                <Input
                  type="number"
                  value={offering.capacity?.min || ''}
                  onChange={(e) => updateOfferingData(type, { 
                    capacity: {
                      ...offering.capacity,
                      min: e.target.value ? Number(e.target.value) : 1,
                      max: offering.capacity?.max || 1
                    }
                  })}
                  placeholder="e.g., 1"
                  min={1}
                  disabled={disabled}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Max Capacity</Label>
                <Input
                  type="number"
                  value={offering.capacity?.max || ''}
                  onChange={(e) => updateOfferingData(type, { 
                    capacity: {
                      min: offering.capacity?.min || 1,
                      ...offering.capacity,
                      max: e.target.value ? Number(e.target.value) : 1
                    }
                  })}
                  placeholder="e.g., 50"
                  min={offering.capacity?.min || 1}
                  disabled={disabled}
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Starting Price</Label>
                <Input
                  type="number"
                  value={offering.startingPrice || ''}
                  onChange={(e) => updateOfferingData(type, { 
                    startingPrice: e.target.value ? Number(e.target.value) : undefined 
                  })}
                  placeholder="e.g., 15000"
                  disabled={disabled}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select
                  value={offering.unit || ''}
                  onValueChange={(value) => updateOfferingData(type, { unit: value as any })}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">per month</SelectItem>
                    <SelectItem value="hr">per hour</SelectItem>
                    <SelectItem value="day">per day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Budget Band</Label>
                <Select
                  value={offering.budgetBand || ''}
                  onValueChange={(value) => updateOfferingData(type, { budgetBand: value })}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="₹">₹ (Budget)</SelectItem>
                    <SelectItem value="₹₹">₹₹ (Mid-range)</SelectItem>
                    <SelectItem value="₹₹₹">₹₹₹ (Premium)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Photos */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Photos *</Label>
                <p className="text-xs text-muted-foreground">
                  {offering.photos?.length || 0} photos uploaded
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
                      if (e.target.files) handlePhotoUpload(type, e.target.files);
                    }}
                    className="hidden"
                    id={`photo-upload-${type}`}
                  />
                  <Label
                    htmlFor={`photo-upload-${type}`}
                    className={cn(
                      "flex items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                      "hover:bg-muted border-muted-foreground/25 hover:border-muted-foreground/50",
                      isUploading && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Upload className="h-5 w-5" />
                    {isUploading ? 'Uploading...' : 'Upload Photos'}
                  </Label>
                </div>
              )}

              {/* Photo grid */}
              {offering.photos && offering.photos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {offering.photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo.url}
                        alt={`${offeringTypeLabels[type]} ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      {!disabled && (
                        <button
                          onClick={() => removePhoto(type, index)}
                          className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Validation messages */}
              {offering.enabled && validation.issues.length > 0 && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4" />
                    Issues to fix:
                  </div>
                  <ul className="mt-1 text-sm text-destructive/80 list-disc list-inside">
                    {validation.issues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-muted/50 p-4 rounded-lg">
        <h3 className="font-medium mb-2">Configure Your Workspace Offerings</h3>
        <p className="text-sm text-muted-foreground">
          Enable and configure the types of workspace you offer. Each enabled offering must have 
          at least one photo and a description.
        </p>
      </div>

      {/* Offering cards */}
      <div className="space-y-4">
        {offeringTypes.map(renderOfferingCard)}
      </div>

      {/* Global error */}
      {errors.offerings && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" />
            {errors.offerings}
          </div>
        </div>
      )}
    </div>
  );
}
