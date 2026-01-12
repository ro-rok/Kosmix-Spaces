import { useState } from "react";
import { Calendar, Clock, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useCreateSiteVisit } from "@/hooks/useApi";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { transparencyLines } from "@/config/contact";
import { AnimatedForm } from "@/components/AnimatedForm";
import { AnimatedButton } from "@/components/AnimatedButton";
import { AnimatedCard } from "@/components/AnimatedCard";
import { ScrollTriggerAnimation } from "@/components/ScrollTriggerAnimation";

interface VisitRequestFormProps {
  listingSlug?: string;
  listingName?: string;
  locality?: string;
}

interface FormData {
  name: string;
  phone: string;
  email: string;
  visitorCount: number;
  preferredSlots: Array<{
    date: string;
    timeSlot: string;
  }>;
}

const timeSlots = [
  "10:00 AM - 11:00 AM",
  "11:00 AM - 12:00 PM", 
  "12:00 PM - 1:00 PM",
  "2:00 PM - 3:00 PM",
  "3:00 PM - 4:00 PM",
  "4:00 PM - 5:00 PM",
  "5:00 PM - 6:00 PM",
];

const initialFormData: FormData = {
  name: "",
  phone: "",
  email: "",
  visitorCount: 1,
  preferredSlots: [],
};

export function VisitRequestForm({ listingSlug, listingName, locality }: VisitRequestFormProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [submitted, setSubmitted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const { toast } = useToast();
  
  const createSiteVisit = useCreateSiteVisit();

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
    if (formData.preferredSlots.length === 0) {
      newErrors.preferredSlots = "Please select at least one preferred time slot";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const visitData = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email || undefined,
        listingIds: [listingSlug!], // Using slug as ID for now
        preferredSlots: formData.preferredSlots,
        visitorCount: formData.visitorCount,
      };

      const response = await createSiteVisit.mutateAsync(visitData);
      
      setSubmitted(true);
      toast({
        title: "Visit Request Submitted!",
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

  const addTimeSlot = (date: string, timeSlot: string) => {
    const newSlot = { date, timeSlot };
    const exists = formData.preferredSlots.some(
      slot => slot.date === date && slot.timeSlot === timeSlot
    );
    
    if (!exists && formData.preferredSlots.length < 3) {
      updateField("preferredSlots", [...formData.preferredSlots, newSlot]);
    }
  };

  const removeTimeSlot = (index: number) => {
    const newSlots = formData.preferredSlots.filter((_, i) => i !== index);
    updateField("preferredSlots", newSlots);
  };

  // Generate next 7 days for date selection
  const getNextSevenDays = () => {
    const days = [];
    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push({
        value: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en-IN', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        }),
      });
    }
    return days;
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
            <Calendar className="h-6 w-6 text-success" />
          </div>
          <h3 className="font-display text-xl font-semibold text-foreground">Visit Scheduled!</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {transparencyLines.slaPromise}
          </p>
          <AnimatedButton variant="whatsapp" className="mt-4" asChild intensity="enhanced">
            <a
              href={buildWhatsAppLink({
                listingName,
                locality,
              })}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp for Updates
            </a>
          </AnimatedButton>
        </div>
      </ScrollTriggerAnimation>
    );
  }

  return (
    <AnimatedForm 
      onSubmit={handleSubmit} 
      className="space-y-6"
      enableFocusAnimations={true}
      enableLoadingState={createSiteVisit.isPending}
    >
      {/* Basic Information */}
      <div className="space-y-4">
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
            <Label htmlFor="visitorCount">Number of Visitors</Label>
            <Select 
              value={formData.visitorCount.toString()} 
              onValueChange={(v) => updateField("visitorCount", parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((count) => (
                  <SelectItem key={count} value={count.toString()}>
                    {count} {count === 1 ? 'person' : 'people'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Time Slot Selection */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-medium">Preferred Time Slots *</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Select up to 3 preferred time slots. We'll confirm the best available option.
          </p>
        </div>

        {/* Selected Slots */}
        {formData.preferredSlots.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Selected Slots:</Label>
            <div className="flex flex-wrap gap-2">
              {formData.preferredSlots.map((slot, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => removeTimeSlot(index)}
                >
                  {new Date(slot.date).toLocaleDateString('en-IN', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })} - {slot.timeSlot}
                  <span className="ml-1">×</span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Date and Time Selection */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Select Date</Label>
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a date" />
              </SelectTrigger>
              <SelectContent>
                {getNextSevenDays().map((day) => (
                  <SelectItem key={day.value} value={day.value}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Select Time</Label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger>
                <SelectValue placeholder="Choose time" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    {slot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Add Selected Slot Button */}
        {selectedDate && selectedTime && (
          <AnimatedButton
            type="button"
            variant="outline"
            onClick={() => {
              addTimeSlot(selectedDate, selectedTime);
              setSelectedDate("");
              setSelectedTime("");
            }}
            disabled={formData.preferredSlots.length >= 3}
            className="w-full"
            intensity="normal"
          >
            Add Time Slot
          </AnimatedButton>
        )}

        {/* Quick Add Buttons */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Quick Add Popular Slots:</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {getNextSevenDays().slice(0, 3).map((day) => (
              <AnimatedCard key={day.value} className="cursor-pointer" elevateOnHover={true} intensity="subtle">
                <CardContent className="p-3">
                  <div className="text-sm font-medium mb-2">{day.label}</div>
                  <div className="grid gap-1">
                    {timeSlots.slice(0, 3).map((slot) => (
                      <AnimatedButton
                        key={`${day.value}-${slot}`}
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="justify-start h-auto py-1 px-2 text-xs"
                        onClick={() => addTimeSlot(day.value, slot)}
                        disabled={formData.preferredSlots.length >= 3}
                        intensity="subtle"
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {slot}
                      </AnimatedButton>
                    ))}
                  </div>
                </CardContent>
              </AnimatedCard>
            ))}
          </div>
        </div>

        {errors.preferredSlots && (
          <p className="text-xs text-destructive">{errors.preferredSlots}</p>
        )}
      </div>

      {/* Submit */}
      <AnimatedButton 
        type="submit" 
        size="lg" 
        className="w-full" 
        disabled={createSiteVisit.isPending}
        intensity="enhanced"
        disableAnimation={createSiteVisit.isPending}
      >
        {createSiteVisit.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Scheduling Visit...
          </>
        ) : (
          <>
            <Calendar className="h-4 w-4" />
            Schedule Visit
          </>
        )}
      </AnimatedButton>

      <p className="text-center text-xs text-muted-foreground">
        {transparencyLines.partnerFee}
      </p>
    </AnimatedForm>
  );
}