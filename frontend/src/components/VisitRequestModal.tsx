import { useState } from "react";
import { Calendar, Clock, Users, MessageCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { AnimatedModal } from "@/components/AnimatedModal";
import { AnimatedButton } from "@/components/AnimatedButton";
import { AnimatedForm } from "@/components/AnimatedForm";
import { z } from "zod";

const visitSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  phone: z.string().trim().min(10, "Valid phone number required").max(15),
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  preferredDates: z.array(z.string()).min(1, "Select at least one date"),
  timeWindow: z.enum(["morning", "afternoon", "evening"]),
  visitorCount: z.number().min(1).max(20),
});

interface VisitRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingSlug: string;
  listingName: string;
  locality: string;
}

export function VisitRequestModal({
  open,
  onOpenChange,
  listingSlug,
  listingName,
  locality,
}: VisitRequestModalProps) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    preferredDates: [] as string[],
    timeWindow: "morning" as "morning" | "afternoon" | "evening",
    visitorCount: 1,
  });

  const today = new Date();
  const dateOptions = Array.from({ length: 14 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i + 1);
    return date.toISOString().split("T")[0];
  });

  const toggleDate = (date: string) => {
    setFormData((prev) => {
      const dates = prev.preferredDates.includes(date)
        ? prev.preferredDates.filter((d) => d !== date)
        : prev.preferredDates.length < 3
          ? [...prev.preferredDates, date]
          : prev.preferredDates;
      return { ...prev, preferredDates: dates };
    });
  };

  const handleSubmit = () => {
    const result = visitSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    // For now, just show success and redirect to WhatsApp
    setStep("success");
  };

  const handleClose = () => {
    setStep("form");
    setFormData({
      name: "",
      phone: "",
      email: "",
      preferredDates: [],
      timeWindow: "morning",
      visitorCount: 1,
    });
    setErrors({});
    onOpenChange(false);
  };

  const formatVisitDetails = () => {
    const dates = formData.preferredDates.map(date => 
      new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
    ).join(", ");
    
    return `Visit Request for ${listingName}
Name: ${formData.name}
Phone: ${formData.phone}
${formData.email ? `Email: ${formData.email}` : ''}
Preferred Dates: ${dates}
Time: ${formData.timeWindow}
Visitors: ${formData.visitorCount}`;
  };

  const whatsappLink = buildWhatsAppLink({ 
    listingName, 
    locality,
    customMessage: step === "success" ? formatVisitDetails() : undefined
  });

  if (step === "success") {
    return (
      <AnimatedModal open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <div className="text-center py-6">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <Check className="h-8 w-8 text-success" />
            </div>
            <h3 className="font-display text-xl font-semibold text-foreground">
              Ready to Schedule!
            </h3>
            <p className="mt-2 text-muted-foreground">
              WhatsApp us with your visit details for immediate confirmation.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <AnimatedButton variant="whatsapp" asChild intensity="enhanced">
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4" />
                  Send Visit Request via WhatsApp
                </a>
              </AnimatedButton>
              <AnimatedButton variant="outline" onClick={handleClose} intensity="subtle">
                Done
              </AnimatedButton>
            </div>
          </div>
        </DialogContent>
      </AnimatedModal>
    );
  }

  return (
    <AnimatedModal open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Request a Visit</DialogTitle>
          <p className="text-sm text-muted-foreground">{listingName}</p>
        </DialogHeader>

        <AnimatedForm className="space-y-6 py-4" enableFocusAnimations={true}>
          {/* Contact Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
            </div>
            <div>
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={errors.phone ? "border-destructive" : ""}
              />
              {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
            </div>
            <div>
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          {/* Preferred Dates */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4" />
              Preferred Dates (select up to 3) *
            </Label>
            {errors.preferredDates && (
              <p className="text-xs text-destructive mb-2">{errors.preferredDates}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {dateOptions.slice(0, 10).map((date) => {
                const isSelected = formData.preferredDates.includes(date);
                const dateObj = new Date(date);
                return (
                  <AnimatedButton
                    key={date}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleDate(date)}
                    intensity="subtle"
                    className="text-sm"
                  >
                    {dateObj.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </AnimatedButton>
                );
              })}
            </div>
          </div>

          {/* Time Window */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4" />
              Preferred Time
            </Label>
            <div className="flex gap-2">
              {(["morning", "afternoon", "evening"] as const).map((time) => (
                <AnimatedButton
                  key={time}
                  type="button"
                  variant={formData.timeWindow === time ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormData({ ...formData, timeWindow: time })}
                  className="flex-1 text-sm"
                  intensity="subtle"
                >
                  {time.charAt(0).toUpperCase() + time.slice(1)}
                </AnimatedButton>
              ))}
            </div>
          </div>

          {/* Visitor Count */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4" />
              Visitors
            </Label>
            <div className="flex items-center gap-3">
              <AnimatedButton
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setFormData({ ...formData, visitorCount: Math.max(1, formData.visitorCount - 1) })
                }
                intensity="subtle"
              >
                -
              </AnimatedButton>
              <span className="w-8 text-center font-medium">{formData.visitorCount}</span>
              <AnimatedButton
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setFormData({ ...formData, visitorCount: Math.min(10, formData.visitorCount + 1) })
                }
                intensity="subtle"
              >
                +
              </AnimatedButton>
            </div>
          </div>

          <AnimatedButton onClick={handleSubmit} className="w-full" size="lg" intensity="enhanced">
            <Calendar className="h-4 w-4" />
            Continue to WhatsApp
          </AnimatedButton>

          <p className="text-xs text-muted-foreground text-center">
            We'll confirm your visit via WhatsApp within 3 hours.
          </p>
        </AnimatedForm>
      </DialogContent>
    </AnimatedModal>
  );
}
