import { useState } from "react";
import { ChevronDown, ChevronUp, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useLocalities, useCreateLead } from "@/hooks/useApi";
import { budgetBandLabels, workspaceTypeLabels, teamSizeBands } from "@/types/models";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { transparencyLines } from "@/config/contact";
import { AnimatedInput, AnimatedTextarea, AnimatedFormField, AnimatedForm } from "@/components/AnimatedForm";
import { AnimatedButton } from "@/components/AnimatedButton";
import { ScrollTriggerAnimation } from "@/components/ScrollTriggerAnimation";

interface EnquiryFormProps {
  listingSlug?: string;
  listingName?: string;
  locality?: string;
  source?: string;
}

interface FormData {
  name: string;
  phone: string;
  email: string;
  company: string;
  preferredLocality: string;
  teamSize: string;
  budgetBand: string;
  spaceType: string;
  moveInTimeframe: string;
  meetingRoomsAddon: boolean;
  gstInvoiceRequired: boolean;
  parkingNeeded: boolean;
  powerBackupRequired: boolean;
  nearMetroPreferred: boolean;
  notes: string;
}

const initialFormData: FormData = {
  name: "",
  phone: "",
  email: "",
  company: "",
  preferredLocality: "",
  teamSize: "",
  budgetBand: "",
  spaceType: "",
  moveInTimeframe: "",
  meetingRoomsAddon: false,
  gstInvoiceRequired: false,
  parkingNeeded: false,
  powerBackupRequired: false,
  nearMetroPreferred: false,
  notes: "",
};

const moveInOptions = [
  { value: "immediate", label: "Immediate (within 1 week)" },
  { value: "1-2weeks", label: "1-2 weeks" },
  { value: "1month", label: "Within 1 month" },
  { value: "2-3months", label: "2-3 months" },
  { value: "exploring", label: "Just exploring" },
];

export function EnquiryForm({ listingSlug, listingName, locality, source = "contact" }: EnquiryFormProps) {
  const [formData, setFormData] = useState<FormData>({
    ...initialFormData,
    preferredLocality: locality || "",
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const { toast } = useToast();
  
  const { data: localitiesData } = useLocalities();
  const createLead = useCreateLead();
  const localities = localitiesData?.localities || localitiesData?.flat || [];

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[6-9]\d{9}$/.test(formData.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Enter a valid 10-digit mobile number";
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const leadData = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email || undefined,
        company: formData.company || undefined,
        preferredLocalities: formData.preferredLocality ? [formData.preferredLocality] : [],
        teamSizeBand: formData.teamSize,
        budgetBandId: formData.budgetBand,
        spaceType: formData.spaceType,
        moveInTimeframe: formData.moveInTimeframe,
        meetingRoomsNeeded: formData.meetingRoomsAddon,
        gstRequired: formData.gstInvoiceRequired,
        parkingNeeded: formData.parkingNeeded,
        powerBackupRequired: formData.powerBackupRequired,
        nearMetroPreferred: formData.nearMetroPreferred,
        notes: formData.notes || undefined,
        source,
        listingSlug,
      };

      const response = await createLead.mutateAsync(leadData);
      
      setSubmitted(true);
      toast({
        title: "Enquiry Submitted!",
        description: response.message,
      });
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Please try WhatsApp or call us directly.",
        variant: "destructive",
      });
    }
  };

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  if (submitted) {
    return (
      <ScrollTriggerAnimation
        animation={{
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          ease: "power2.out",
        }}
      >
        <div className="rounded-xl border border-success/30 bg-success/5 p-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/20">
            <svg className="h-6 w-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="font-display text-xl font-semibold text-foreground">Got it!</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {transparencyLines.slaPromise}
          </p>
          <AnimatedButton variant="whatsapp" className="mt-4" asChild intensity="enhanced">
            <a
              href={buildWhatsAppLink({
                listingName,
                locality: formData.preferredLocality,
                teamSize: formData.teamSize,
                budgetBand: formData.budgetBand,
                spaceType: formData.spaceType,
              })}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp for Faster Response
            </a>
          </AnimatedButton>
        </div>
      </ScrollTriggerAnimation>
    );
  }

  return (
    <AnimatedForm
      onSubmit={handleSubmit}
      className="space-y-4"
      enableFocusAnimations={true}
      enableLoadingState={createLead.isPending}
    >
      {/* Essential Fields */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="Your name"
            className={errors.name ? "border-destructive" : ""}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone *</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            placeholder="10-digit mobile number"
            className={errors.phone ? "border-destructive" : ""}
          />
          {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="teamSize">Team Size</Label>
        <Select value={formData.teamSize} onValueChange={(v) => updateField("teamSize", v)}>
          <SelectTrigger>
            <SelectValue placeholder="How many people?" />
          </SelectTrigger>
          <SelectContent>
            {teamSizeBands.map((band) => (
              <SelectItem key={band.value} value={band.value}>
                {band.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="spaceType">Space Type</Label>
        <Select value={formData.spaceType} onValueChange={(v) => updateField("spaceType", v)}>
          <SelectTrigger>
            <SelectValue placeholder="What are you looking for?" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(workspaceTypeLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Advanced Fields Toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex w-full items-center justify-center gap-1 rounded-lg bg-muted py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/80"
      >
        {showAdvanced ? (
          <>
            Less details <ChevronUp className="h-4 w-4" />
          </>
        ) : (
          <>
            More details <ChevronDown className="h-4 w-4" />
          </>
        )}
      </button>

      {/* Advanced Fields */}
      {showAdvanced && (
        <div className="space-y-4 rounded-lg bg-muted/30 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="your@email.com"
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => updateField("company", e.target.value)}
                placeholder="Company name"
              />
            </div>
          </div>

          {!locality && (
            <div className="space-y-2">
              <Label htmlFor="preferredLocality">Preferred Locality</Label>
              <Select value={formData.preferredLocality} onValueChange={(v) => updateField("preferredLocality", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Any locality" />
                </SelectTrigger>
                <SelectContent>
                  {localities.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="other-locality" className="border-t border-border mt-1 pt-2">
                    <span className="text-muted-foreground">Other (Not Listed)</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="budgetBand">Budget Range</Label>
              <Select value={formData.budgetBand} onValueChange={(v) => updateField("budgetBand", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select budget" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(budgetBandLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="moveInTimeframe">Move-in Timeframe</Label>
              <Select value={formData.moveInTimeframe} onValueChange={(v) => updateField("moveInTimeframe", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="When?" />
                </SelectTrigger>
                <SelectContent>
                  {moveInOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Toggle Requirements */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Requirements</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <Label htmlFor="nearMetro" className="text-sm">Near Metro</Label>
                <Switch
                  id="nearMetro"
                  checked={formData.nearMetroPreferred}
                  onCheckedChange={(v) => updateField("nearMetroPreferred", v)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <Label htmlFor="parkingNeeded" className="text-sm">Parking Needed</Label>
                <Switch
                  id="parkingNeeded"
                  checked={formData.parkingNeeded}
                  onCheckedChange={(v) => updateField("parkingNeeded", v)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <Label htmlFor="powerBackup" className="text-sm">Power Backup</Label>
                <Switch
                  id="powerBackup"
                  checked={formData.powerBackupRequired}
                  onCheckedChange={(v) => updateField("powerBackupRequired", v)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <Label htmlFor="gstInvoice" className="text-sm">GST Invoice</Label>
                <Switch
                  id="gstInvoice"
                  checked={formData.gstInvoiceRequired}
                  onCheckedChange={(v) => updateField("gstInvoiceRequired", v)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3 sm:col-span-2">
                <Label htmlFor="meetingRooms" className="text-sm">Meeting Rooms Add-on</Label>
                <Switch
                  id="meetingRooms"
                  checked={formData.meetingRoomsAddon}
                  onCheckedChange={(v) => updateField("meetingRoomsAddon", v)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Any specific requirements..."
              rows={3}
            />
          </div>
        </div>
      )}

      {/* Submit */}
      <AnimatedButton 
        type="submit" 
        size="lg" 
        className="w-full" 
        disabled={createLead.isPending}
        intensity="enhanced"
        disableAnimation={createLead.isPending}
      >
        {createLead.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit Enquiry"
        )}
      </AnimatedButton>

      <p className="text-center text-xs text-muted-foreground">
        {transparencyLines.partnerFee}
      </p>
    </AnimatedForm>
  );
}
