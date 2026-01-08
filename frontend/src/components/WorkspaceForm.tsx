import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { ChevronDown, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { WorkspaceType, BudgetBand, AvailabilityStatus } from "@/types/models";
import { useLocalities } from "@/hooks/useApi";
import { cn } from "@/lib/utils";

const workspaceFormSchema = z.object({
  displayName: z.string().min(1, "Display name is required").max(100),
  localityId: z.string().min(1, "Locality is required"),
  workspaceTypes: z.array(z.enum(["dedicated-desk", "private-cabin", "managed-office"])).min(1, "Select at least one workspace type"),
  photos: z.array(z.string().url("Must be a valid URL")).min(1, "At least one photo URL is required"),
  seatCapacityMin: z.number().min(1, "Minimum capacity must be at least 1"),
  seatCapacityMax: z.number().min(1, "Maximum capacity must be at least 1"),
  availabilityStatus: z.enum(["available", "limited", "waitlist"]),
  budgetBand: z.enum(["5k-10k", "10k-20k", "20k-40k", "40k-80k", "80k+"]),
  budgetDisplayText: z.string().optional(),
  nearMetro: z.boolean(),
  metroNote: z.string().optional(),
  parking: z.boolean(),
  powerBackup: z.boolean(),
  gstInvoiceAvailable: z.boolean(),
  accessHours: z.string().min(1, "Access hours are required"),
  amenities: z.array(z.string()).min(1, "Select at least one amenity"),
  overview: z.string().min(10, "Overview must be at least 10 characters").max(500, "Overview must be 500 characters or less"),
  meetingRoomsAddon: z.boolean().optional(),
  meetingRoomsCount: z.number().optional(),
  internetSpeedMbps: z.number().optional(),
  dealTags: z.array(z.string()).optional(),
  dealDetails: z.string().optional(),
  houseRules: z.string().optional(),
  highlights: z.array(z.string()).optional(),
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

export function WorkspaceForm({ onSubmit, initialData, isLoading = false }: WorkspaceFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<string[]>(initialData?.photos || [""]);
  const [dealTags, setDealTags] = useState<string[]>(initialData?.dealTags || []);
  const [newDealTag, setNewDealTag] = useState("");
  const [highlights, setHighlights] = useState<string[]>(initialData?.highlights || []);
  const [newHighlight, setNewHighlight] = useState("");

  const { data: localitiesData } = useLocalities();
  const localities = localitiesData || [];

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
    setValue,
  } = useForm<WorkspaceFormData>({
    resolver: zodResolver(workspaceFormSchema),
    defaultValues: {
      displayName: initialData?.displayName || "",
      localityId: initialData?.localityId || "",
      workspaceTypes: initialData?.workspaceTypes || [],
      photos: initialData?.photos || [],
      seatCapacityMin: initialData?.seatCapacityMin || 1,
      seatCapacityMax: initialData?.seatCapacityMax || 10,
      availabilityStatus: initialData?.availabilityStatus || "available",
      budgetBand: initialData?.budgetBand || "10k-20k",
      budgetDisplayText: initialData?.budgetDisplayText || "",
      nearMetro: initialData?.nearMetro || false,
      metroNote: initialData?.metroNote || "",
      parking: initialData?.parking || false,
      powerBackup: initialData?.powerBackup || false,
      gstInvoiceAvailable: initialData?.gstInvoiceAvailable || false,
      accessHours: initialData?.accessHours || "9 AM - 9 PM",
      amenities: initialData?.amenities || [],
      overview: initialData?.overview || "",
      meetingRoomsAddon: initialData?.meetingRoomsAddon || false,
      meetingRoomsCount: initialData?.meetingRoomsCount,
      internetSpeedMbps: initialData?.internetSpeedMbps,
      dealTags: initialData?.dealTags || [],
      dealDetails: initialData?.dealDetails || "",
      houseRules: initialData?.houseRules || "",
      highlights: initialData?.highlights || [],
    },
  });

  const selectedWorkspaceTypes = watch("workspaceTypes");
  const selectedAmenities = watch("amenities");

  const addPhotoUrl = () => {
    setPhotoUrls([...photoUrls, ""]);
  };

  const removePhotoUrl = (index: number) => {
    const newUrls = photoUrls.filter((_, i) => i !== index);
    setPhotoUrls(newUrls);
    setValue("photos", newUrls.filter((url) => url.trim() !== ""));
  };

  const updatePhotoUrl = (index: number, value: string) => {
    const newUrls = [...photoUrls];
    newUrls[index] = value;
    setPhotoUrls(newUrls);
    setValue("photos", newUrls.filter((url) => url.trim() !== ""));
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

  const addHighlight = () => {
    if (newHighlight.trim() && !highlights.includes(newHighlight.trim())) {
      const newHighlights = [...highlights, newHighlight.trim()];
      setHighlights(newHighlights);
      setValue("highlights", newHighlights);
      setNewHighlight("");
    }
  };

  const removeHighlight = (highlight: string) => {
    const newHighlights = highlights.filter((h) => h !== highlight);
    setHighlights(newHighlights);
    setValue("highlights", newHighlights);
  };

  const onFormSubmit = (data: WorkspaceFormData) => {
    onSubmit(data);
  };

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
          <Label>Photos *</Label>
          <p className="text-xs text-muted-foreground">Enter image URLs (at least one required)</p>
          <div className="space-y-2">
            {photoUrls.map((url, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  type="url"
                  value={url}
                  onChange={(e) => updatePhotoUrl(index, e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1"
                />
                {photoUrls.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removePhotoUrl(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addPhotoUrl}>
              <Plus className="h-4 w-4" />
              Add Photo URL
            </Button>
          </div>
          {errors.photos && <p className="text-xs text-destructive">{errors.photos.message}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="seatCapacityMin">Min Capacity *</Label>
            <Input
              id="seatCapacityMin"
              type="number"
              {...register("seatCapacityMin", { valueAsNumber: true })}
              min={1}
              className={errors.seatCapacityMin ? "border-destructive" : ""}
            />
            {errors.seatCapacityMin && <p className="text-xs text-destructive">{errors.seatCapacityMin.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="seatCapacityMax">Max Capacity *</Label>
            <Input
              id="seatCapacityMax"
              type="number"
              {...register("seatCapacityMax", { valueAsNumber: true })}
              min={1}
              className={errors.seatCapacityMax ? "border-destructive" : ""}
            />
            {errors.seatCapacityMax && <p className="text-xs text-destructive">{errors.seatCapacityMax.message}</p>}
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
      </div>

      {/* Facilities */}
      <div className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Facilities</h2>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Controller
              name="parking"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="parking"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="parking" className="cursor-pointer">Parking Available</Label>
          </div>
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
          <div className="flex items-center space-x-2">
            <Controller
              name="gstInvoiceAvailable"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="gstInvoiceAvailable"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="gstInvoiceAvailable" className="cursor-pointer">GST Invoice Available</Label>
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
            <Label htmlFor="houseRules">House Rules</Label>
            <Textarea
              id="houseRules"
              {...register("houseRules")}
              placeholder="Any rules or guidelines for workspace users"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Highlights</Label>
            <div className="flex gap-2">
              <Input
                value={newHighlight}
                onChange={(e) => setNewHighlight(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addHighlight();
                  }
                }}
                placeholder="Add highlight"
              />
              <Button type="button" variant="outline" onClick={addHighlight}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {highlights.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {highlights.map((highlight) => (
                  <span
                    key={highlight}
                    className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-3 py-1 text-sm"
                  >
                    {highlight}
                    <button
                      type="button"
                      onClick={() => removeHighlight(highlight)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? "Submitting..." : "Submit Listing"}
        </Button>
      </div>
    </form>
  );
}
