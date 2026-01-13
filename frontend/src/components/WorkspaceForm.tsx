import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { ChevronDown, Plus, X, Upload, Eye, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkspaceType, BudgetBand, AvailabilityStatus } from "@/types/models";
import { useLocalities } from "@/hooks/useApi";
import { WorkspacePreview } from "@/components/WorkspacePreview";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Image compression utility
const compressImage = (file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (blob) {
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        }
      }, 'image/jpeg', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

const workspaceFormSchema = z.object({
  displayName: z.string().min(1, "Display name is required").max(100),
  localityId: z.string().min(1, "Locality is required"),
  workspaceTypes: z.array(z.enum(["dedicated-desk", "private-cabin", "managed-office"])).min(1, "Select at least one workspace type"),
  seatCapacityMin: z.number().min(1, "Minimum capacity must be at least 1").max(1000, "Minimum capacity cannot exceed 1000"),
  seatCapacityMax: z.number().min(1, "Maximum capacity must be at least 1").max(1000, "Maximum capacity cannot exceed 1000"),
  availabilityStatus: z.enum(["available", "limited", "waitlist"]),
  budgetBand: z.enum(["5k-10k", "10k-20k", "20k-40k", "40k-80k", "80k+"]),
  budgetDisplayText: z.string().optional(),
  nearMetro: z.boolean(),
  metroNote: z.string().optional(),
  parking: z.string().default("NONE"),
  powerBackup: z.boolean(),
  weekendAccess: z.boolean().optional(),
  accessHours: z.string().min(1, "Access hours are required"),
  amenities: z.array(z.string()).min(1, "Select at least one amenity"),
  overview: z.string().min(10, "Overview must be at least 10 characters").max(500, "Overview must be 500 characters or less"),
  meetingRoomsAddon: z.boolean().optional(),
  meetingRoomsCount: z.number().optional(),
  internetSpeedMbps: z.number().optional(),
  dealTags: z.array(z.string()).optional(),
  dealDetails: z.string().optional(),
  dealEligibility: z.string().optional(),
  houseRules: z.string().optional(),
  // Photos are handled separately, not in form validation
  photos: z.array(z.any()).optional(),
}).refine((data) => data.seatCapacityMax >= data.seatCapacityMin, {
  message: "Maximum capacity must be greater than or equal to minimum capacity",
  path: ["seatCapacityMax"],
});

type WorkspaceFormData = z.infer<typeof workspaceFormSchema>;

interface WorkspaceFormProps {
  onSubmit: (data: WorkspaceFormData) => void;
  initialData?: Partial<WorkspaceFormData>;
  isLoading?: boolean;
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
];

const parkingOptions = [
  { value: "NONE", label: "No Parking" },
  { value: "TWO_WHEELER", label: "Two Wheeler Only" },
  { value: "FOUR_WHEELER", label: "Four Wheeler Only" },
  { value: "BOTH", label: "Both Available" },
];

export function WorkspaceForm({ onSubmit, initialData, isLoading = false }: WorkspaceFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [dealTags, setDealTags] = useState<string[]>(initialData?.dealTags || []);
  const [newDealTag, setNewDealTag] = useState("");
  const [formData, setFormData] = useState<WorkspaceFormData | null>(null);

  const { data: localitiesData } = useLocalities();
  const localities = localitiesData?.localities || localitiesData?.flat || [];

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
    setValue,
    getValues,
  } = useForm<WorkspaceFormData>({
    resolver: zodResolver(workspaceFormSchema),
    defaultValues: {
      displayName: initialData?.displayName || "",
      localityId: initialData?.localityId || "",
      workspaceTypes: initialData?.workspaceTypes || [],
      seatCapacityMin: initialData?.seatCapacityMin || 1,
      seatCapacityMax: initialData?.seatCapacityMax || 50,
      availabilityStatus: initialData?.availabilityStatus || "available",
      budgetBand: initialData?.budgetBand || "10k-20k",
      budgetDisplayText: initialData?.budgetDisplayText || "",
      nearMetro: initialData?.nearMetro || false,
      metroNote: initialData?.metroNote || "",
      parking: initialData?.parking || "NONE",
      powerBackup: initialData?.powerBackup || false,
      weekendAccess: initialData?.weekendAccess || false,
      accessHours: initialData?.accessHours || "9 AM - 9 PM",
      amenities: initialData?.amenities || [],
      overview: initialData?.overview || "",
      meetingRoomsAddon: initialData?.meetingRoomsAddon || false,
      meetingRoomsCount: initialData?.meetingRoomsCount,
      internetSpeedMbps: initialData?.internetSpeedMbps,
      dealTags: initialData?.dealTags || [],
      dealDetails: initialData?.dealDetails || "",
      dealEligibility: initialData?.dealEligibility || "",
      houseRules: initialData?.houseRules || "",
    },
  });

  const selectedWorkspaceTypes = watch("workspaceTypes");
  const selectedAmenities = watch("amenities");

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    try {
      const compressedFiles: File[] = [];
      const previewUrls: string[] = [];

      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image file`);
          continue;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          toast.error(`${file.name} is too large. Maximum size is 10MB`);
          continue;
        }

        // Compress image
        const compressedFile = await compressImage(file);
        compressedFiles.push(compressedFile);
        previewUrls.push(URL.createObjectURL(compressedFile));
      }

      const newPhotos = [...photos, ...compressedFiles];
      const newPreviewUrls = [...photoPreviewUrls, ...previewUrls];

      setPhotos(newPhotos);
      setPhotoPreviewUrls(newPreviewUrls);

      toast.success(`${compressedFiles.length} photo(s) added and compressed`);
    } catch (error) {
      toast.error("Failed to process images");
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    const newPreviewUrls = photoPreviewUrls.filter((_, i) => i !== index);
    
    // Revoke the URL to free memory
    URL.revokeObjectURL(photoPreviewUrls[index]);
    
    setPhotos(newPhotos);
    setPhotoPreviewUrls(newPreviewUrls);
  };

  const toggleWorkspaceType = (type: WorkspaceType) => {
    const current = selectedWorkspaceTypes || [];
    const newTypes = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    setValue("workspaceTypes", newTypes);
  };

  const toggleAmenity = (amenity: string) => {
    const current = selectedAmenities || [];
    const newAmenities = current.includes(amenity)
      ? current.filter((a) => a !== amenity)
      : [...current, amenity];
    setValue("amenities", newAmenities);
  };

  const addDealTag = () => {
    if (newDealTag.trim() && !dealTags.includes(newDealTag.trim())) {
      const newTags = [...dealTags, newDealTag.trim()];
      setDealTags(newTags);
      setValue("dealTags", newTags);
      setNewDealTag("");
    }
  };

  const removeDealTag = (tag: string) => {
    const newTags = dealTags.filter((t) => t !== tag);
    setDealTags(newTags);
    setValue("dealTags", newTags);
  };

  const onFormSubmit = (data: WorkspaceFormData) => {
    // Check if photos are required and present
    if (photos.length === 0) {
      toast.error("At least one photo is required");
      return;
    }
    
    // Add photos to form data
    const formDataWithPhotos = {
      ...data,
      photos: photos
    };
    
    setFormData(formDataWithPhotos);
    setShowPreview(true);
  };

  const handleFinalSubmit = () => {
    if (formData) {
      onSubmit(formData);
    }
  };

  const handleBackToEdit = () => {
    setShowPreview(false);
  };

  // Convert form data to preview format
  const getPreviewData = () => {
    if (!formData) return null;

    const selectedLocality = localities.find(l => l.id === formData.localityId);
    
    return {
      listingId: "preview",
      slug: "preview",
      displayName: formData.displayName,
      locality: selectedLocality?.name || "",
      city: selectedLocality?.city || "Delhi",
      workspaceTypes: formData.workspaceTypes,
      photos: photoPreviewUrls.map(url => ({ url, width: 800, height: 600 })),
      seatCapacityMin: formData.seatCapacityMin,
      seatCapacityMax: formData.seatCapacityMax,
      availabilityStatus: formData.availabilityStatus,
      budgetBandId: formData.budgetBand,
      budgetDisplayText: formData.budgetDisplayText || "Contact for pricing",
      pricingMode: "on-enquiry",
      nearMetro: formData.nearMetro,
      metroNote: formData.metroNote,
      parking: formData.parking !== "NONE",
      powerBackup: formData.powerBackup,
      gstInvoiceAvailable: false, // Removed from form
      accessHours: formData.accessHours,
      amenities: formData.amenities,
      meetingRoomsAddon: formData.meetingRoomsAddon || false,
      dealTags: formData.dealTags || [],
      verificationStatus: "pending",
      highlights: [],
      overview: formData.overview,
      createdAt: new Date().toISOString(),
    };
  };

  if (showPreview && formData) {
    const previewData = getPreviewData();
    
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBackToEdit}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="font-display text-xl font-bold">Preview Your Listing</h2>
            <p className="text-sm text-muted-foreground">Review your listing before submitting</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            {previewData && <WorkspacePreview listing={previewData} />}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button variant="outline" onClick={handleBackToEdit} className="flex-1">
            <ArrowLeft className="h-4 w-4" />
            Back to Edit
          </Button>
          <Button onClick={handleFinalSubmit} disabled={isLoading} className="flex-1">
            {isLoading ? "Submitting..." : "Confirm & Submit"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Essential Fields */}
      <div className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Essential Information</h2>

        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name *</Label>
          <Input
            id="displayName"
            {...register("displayName")}
            placeholder="e.g., Premium Workspace in Connaught Place"
            className={errors.displayName ? "border-destructive" : ""}
          />
          {errors.displayName && <p className="text-xs text-destructive">{errors.displayName.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="localityId">Locality *</Label>
          <Controller
            name="localityId"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className={errors.localityId ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select locality" />
                </SelectTrigger>
                <SelectContent>
                  {localities.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.localityId && <p className="text-xs text-destructive">{errors.localityId.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Workspace Types *</Label>
          <div className="flex flex-wrap gap-2">
            {(["dedicated-desk", "private-cabin", "managed-office"] as WorkspaceType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => toggleWorkspaceType(type)}
                className={cn(
                  "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                  selectedWorkspaceTypes?.includes(type)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-muted"
                )}
              >
                {type === "dedicated-desk" && "Dedicated Desk"}
                {type === "private-cabin" && "Private Cabin"}
                {type === "managed-office" && "Managed Office"}
              </button>
            ))}
          </div>
          {errors.workspaceTypes && <p className="text-xs text-destructive">{errors.workspaceTypes.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Photos * (Images will be compressed automatically)</Label>
          <p className="text-xs text-muted-foreground">Upload high-quality images of your workspace. Maximum 10MB per image.</p>
          
          {/* Photo Upload */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
                id="photo-upload"
              />
              <Label
                htmlFor="photo-upload"
                className="flex items-center gap-2 px-4 py-2 border border-dashed border-border rounded-lg cursor-pointer hover:bg-muted transition-colors"
              >
                <Upload className="h-4 w-4" />
                Upload Photos
              </Label>
              <span className="text-sm text-muted-foreground">
                {photos.length} photo(s) selected
              </span>
            </div>

            {/* Photo Previews */}
            {photoPreviewUrls.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photoPreviewUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="seatCapacityMin">Min Capacity *</Label>
            <Input
              id="seatCapacityMin"
              type="number"
              {...register("seatCapacityMin", { valueAsNumber: true })}
              min={1}
              max={1000}
              step={1}
              placeholder="e.g., 1"
              className={errors.seatCapacityMin ? "border-destructive" : ""}
            />
            {errors.seatCapacityMin && <p className="text-xs text-destructive">{errors.seatCapacityMin.message}</p>}
            <p className="text-xs text-muted-foreground">Minimum number of seats available</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="seatCapacityMax">Max Capacity *</Label>
            <Input
              id="seatCapacityMax"
              type="number"
              {...register("seatCapacityMax", { valueAsNumber: true })}
              min={1}
              max={1000}
              step={1}
              placeholder="e.g., 50"
              className={errors.seatCapacityMax ? "border-destructive" : ""}
            />
            {errors.seatCapacityMax && <p className="text-xs text-destructive">{errors.seatCapacityMax.message}</p>}
            <p className="text-xs text-muted-foreground">Maximum number of seats available</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="availabilityStatus">Availability Status *</Label>
          <Controller
            name="availabilityStatus"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available Now</SelectItem>
                  <SelectItem value="limited">Limited Availability</SelectItem>
                  <SelectItem value="waitlist">Waitlist Only</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="budgetBand">Budget Band *</Label>
          <Controller
            name="budgetBand"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5k-10k">₹5K - 10K/seat</SelectItem>
                  <SelectItem value="10k-20k">₹10K - 20K/seat</SelectItem>
                  <SelectItem value="20k-40k">₹20K - 40K/seat</SelectItem>
                  <SelectItem value="40k-80k">₹40K - 80K/seat</SelectItem>
                  <SelectItem value="80k+">₹80K+/seat</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="budgetDisplayText">Budget Display Text</Label>
          <Input
            id="budgetDisplayText"
            {...register("budgetDisplayText")}
            placeholder="e.g., Starting from ₹15,000/seat or Contact for pricing"
          />
          <p className="text-xs text-muted-foreground">Optional custom pricing text</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="overview">Overview *</Label>
          <Textarea
            id="overview"
            {...register("overview")}
            placeholder="Describe your workspace (max 500 characters)"
            rows={4}
            maxLength={500}
            className={errors.overview ? "border-destructive" : ""}
          />
          <p className="text-xs text-muted-foreground">
            {watch("overview")?.length || 0}/500 characters
          </p>
          {errors.overview && <p className="text-xs text-destructive">{errors.overview.message}</p>}
        </div>
      </div>

      {/* Location & Access */}
      <div className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Location & Access</h2>

        <div className="flex items-center space-x-2">
          <Controller
            name="nearMetro"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="nearMetro"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <Label htmlFor="nearMetro" className="cursor-pointer">Near Metro</Label>
        </div>

        {watch("nearMetro") && (
          <div className="space-y-2">
            <Label htmlFor="metroNote">Metro Note</Label>
            <Input
              id="metroNote"
              {...register("metroNote")}
              placeholder="e.g., 2 min walk from Rajiv Chowk Metro"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="accessHours">Access Hours *</Label>
          <Input
            id="accessHours"
            {...register("accessHours")}
            placeholder="e.g., 9 AM - 9 PM or 24/7 Access"
            className={errors.accessHours ? "border-destructive" : ""}
          />
          {errors.accessHours && <p className="text-xs text-destructive">{errors.accessHours.message}</p>}
        </div>

        <div className="flex items-center space-x-2">
          <Controller
            name="weekendAccess"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="weekendAccess"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <Label htmlFor="weekendAccess" className="cursor-pointer">Weekend Access Available</Label>
        </div>
      </div>

      {/* Facilities */}
      <div className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Facilities</h2>

        <div className="space-y-2">
          <Label htmlFor="parking">Parking *</Label>
          <Controller
            name="parking"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
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
            )}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Controller
              name="powerBackup"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="powerBackup"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="powerBackup" className="cursor-pointer">Power Backup</Label>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Amenities *</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {commonAmenities.map((amenity) => (
              <div key={amenity} className="flex items-center space-x-2">
                <Checkbox
                  id={`amenity-${amenity}`}
                  checked={selectedAmenities?.includes(amenity) || false}
                  onCheckedChange={() => toggleAmenity(amenity)}
                />
                <Label htmlFor={`amenity-${amenity}`} className="cursor-pointer text-sm">
                  {amenity}
                </Label>
              </div>
            ))}
          </div>
          {errors.amenities && <p className="text-xs text-destructive">{errors.amenities.message}</p>}
        </div>
      </div>

      {/* Advanced Fields */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleTrigger asChild>
          <Button type="button" variant="outline" className="w-full">
            Advanced Fields
            <ChevronDown className={cn("ml-2 h-4 w-4 transition-transform", showAdvanced && "rotate-180")} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 mt-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Controller
                name="meetingRoomsAddon"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="meetingRoomsAddon"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="meetingRoomsAddon" className="cursor-pointer">Meeting Rooms Available (Add-on)</Label>
            </div>
            {watch("meetingRoomsAddon") && (
              <div className="space-y-2">
                <Label htmlFor="meetingRoomsCount">Number of Meeting Rooms</Label>
                <Input
                  id="meetingRoomsCount"
                  type="number"
                  {...register("meetingRoomsCount", { valueAsNumber: true })}
                  min={0}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="internetSpeedMbps">Internet Speed (Mbps)</Label>
            <Input
              id="internetSpeedMbps"
              type="number"
              {...register("internetSpeedMbps", { valueAsNumber: true })}
              placeholder="e.g., 100"
            />
          </div>

          <div className="space-y-2">
            <Label>Deal Tags</Label>
            <div className="flex gap-2">
              <Input
                value={newDealTag}
                onChange={(e) => setNewDealTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addDealTag();
                  }
                }}
                placeholder="Add deal tag"
              />
              <Button type="button" variant="outline" onClick={addDealTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {dealTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {dealTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeDealTag(tag)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dealDetails">Deal Details</Label>
            <Textarea
              id="dealDetails"
              {...register("dealDetails")}
              placeholder="Details about current deals (subject to availability)"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dealEligibility">Deal Eligibility</Label>
            <Textarea
              id="dealEligibility"
              {...register("dealEligibility")}
              placeholder="Who is eligible for the deals (e.g., new customers, minimum commitment)"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="houseRules">House Rules</Label>
            <Textarea
              id="houseRules"
              {...register("houseRules")}
              placeholder="Any rules or guidelines for workspace users"
              rows={3}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={isLoading} className="flex-1">
          <Eye className="h-4 w-4" />
          Preview Listing
        </Button>
      </div>
    </form>
  );
}
