/**
 * Enhanced enquiry form with comprehensive validation and error handling
 */

import React from "react";
import { z } from "zod";
import { useEnquiryForm } from "@/hooks/useEnhancedForm";
import { enhancedValidationSchemas } from "@/lib/form-validation";
import { InputField, SelectField, TextareaField, SwitchField, FormSection, FormGrid } from "@/components/ui/form-field";
import { LoadingButton } from "@/components/ui/loading-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { api } from "@/lib/api";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { transparencyLines } from "@/config/contact";
import { budgetBandLabels, workspaceTypeLabels, teamSizeBands } from "@/types/models";
import { useLocalities } from "@/hooks/useApi";

// Enhanced validation schema
const enquirySchema = z.object({
  name: enhancedValidationSchemas.name,
  phone: enhancedValidationSchemas.phone,
  email: enhancedValidationSchemas.email.optional().or(z.literal("")),
  company: enhancedValidationSchemas.optionalString(100),
  preferredLocality: enhancedValidationSchemas.requiredString("Preferred locality"),
  teamSize: enhancedValidationSchemas.requiredString("Team size"),
  budgetBand: enhancedValidationSchemas.requiredString("Budget range"),
  spaceType: enhancedValidationSchemas.requiredString("Space type"),
  moveInTimeframe: z.string().optional(),
  meetingRoomsNeeded: z.boolean().optional(),
  gstRequired: z.boolean().optional(),
  parkingNeeded: z.boolean().optional(),
  powerBackupRequired: z.boolean().optional(),
  nearMetroPreferred: z.boolean().optional(),
  notes: enhancedValidationSchemas.optionalString(500),
});

type EnquiryFormData = z.infer<typeof enquirySchema>;

interface EnhancedEnquiryFormProps {
  listingSlug?: string;
  listingName?: string;
  locality?: string;
  source?: string;
  onSuccess?: (result: any) => void;
}

const initialFormData: EnquiryFormData = {
  name: "",
  phone: "",
  email: "",
  company: "",
  preferredLocality: "",
  teamSize: "",
  budgetBand: "",
  spaceType: "",
  moveInTimeframe: "",
  meetingRoomsNeeded: false,
  gstRequired: false,
  parkingNeeded: false,
  powerBackupRequired: false,
  nearMetroPreferred: false,
  notes: "",
};

const moveInOptions = [
  { value: "", label: "Select timeframe" },
  { value: "immediate", label: "Immediate (within 1 week)" },
  { value: "1-2weeks", label: "1-2 weeks" },
  { value: "1month", label: "Within 1 month" },
  { value: "2-3months", label: "2-3 months" },
  { value: "exploring", label: "Just exploring" },
];

export function EnhancedEnquiryForm({ 
  listingSlug, 
  listingName, 
  locality, 
  source = "contact",
  onSuccess 
}: EnhancedEnquiryFormProps) {
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [submissionResult, setSubmissionResult] = React.useState<any>(null);

  const { data: localitiesData } = useLocalities();
  const localities = localitiesData?.localities || localitiesData?.flat || [];

  // Initialize form with enhanced validation
  const form = useEnquiryForm(enquirySchema, {
    ...initialFormData,
    preferredLocality: locality || "",
  }, {
    onSuccess: (result) => {
      setSubmitted(true);
      setSubmissionResult(result);
      onSuccess?.(result);
    },
    successMessage: "Your enquiry has been submitted successfully!",
  });

  // Submit handler
  const handleSubmit = form.handleSubmit(async (data) => {
    const leadData = {
      name: data.name,
      phone: data.phone,
      email: data.email || undefined,
      company: data.company || undefined,
      preferredLocalities: data.preferredLocality ? [data.preferredLocality] : [],
      teamSizeBand: data.teamSize,
      budgetBandId: data.budgetBand,
      spaceType: data.spaceType,
      moveInTimeframe: data.moveInTimeframe,
      meetingRoomsNeeded: data.meetingRoomsNeeded,
      gstRequired: data.gstRequired,
      parkingNeeded: data.parkingNeeded,
      powerBackupRequired: data.powerBackupRequired,
      nearMetroPreferred: data.nearMetroPreferred,
      notes: data.notes || undefined,
      source,
      listingSlug,
    };

    return api.public.createLead(leadData);
  });

  // Success state
  if (submitted) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/20">
              <CheckCircle2 className="h-6 w-6 text-success" />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-display text-xl font-semibold">Enquiry Submitted!</h3>
              <p className="text-sm text-muted-foreground">
                {transparencyLines.slaPromise}
              </p>
            </div>

            {submissionResult?.whatsappDeepLink && (
              <LoadingButton 
                variant="default" 
                className="w-full"
                asChild
              >
                <a
                  href={submissionResult.whatsappDeepLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Continue on WhatsApp
                </a>
              </LoadingButton>
            )}

            <LoadingButton 
              variant="outline" 
              onClick={() => {
                setSubmitted(false);
                form.reset();
              }}
            >
              Submit Another Enquiry
            </LoadingButton>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Get in Touch</CardTitle>
        <CardDescription>
          Tell us about your workspace requirements and we'll help you find the perfect space.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General form error */}
          {form.errors._form && (
            <Alert variant="destructive">
              <AlertDescription>{form.errors._form}</AlertDescription>
            </Alert>
          )}

          {/* Essential Information */}
          <FormSection title="Contact Information">
            <FormGrid columns={2}>
              <InputField
                {...form.getFieldProps("name")}
                label="Full Name"
                placeholder="Your full name"
                required
                autoComplete="name"
              />
              
              <InputField
                {...form.getFieldProps("phone")}
                label="Phone Number"
                type="tel"
                placeholder="+91-XXXXXXXXXX"
                required
                autoComplete="tel"
              />
            </FormGrid>

            <InputField
              {...form.getFieldProps("email")}
              label="Email Address"
              type="email"
              placeholder="your@email.com"
              description="Optional, but helps us send you detailed information"
              autoComplete="email"
            />
          </FormSection>

          {/* Requirements */}
          <FormSection title="Workspace Requirements">
            <FormGrid columns={2}>
              <SelectField
                {...form.getFieldProps("teamSize")}
                label="Team Size"
                placeholder="How many people?"
                required
                options={teamSizeBands.map(band => ({
                  value: band.value,
                  label: band.label
                }))}
              />

              <SelectField
                {...form.getFieldProps("spaceType")}
                label="Space Type"
                placeholder="What are you looking for?"
                required
                options={Object.entries(workspaceTypeLabels).map(([value, label]) => ({
                  value,
                  label
                }))}
              />
            </FormGrid>

            {!locality && (
              <SelectField
                {...form.getFieldProps("preferredLocality")}
                label="Preferred Locality"
                placeholder="Select locality"
                required
                options={[
                  { value: "", label: "Any locality" },
                  ...localities.map(loc => ({
                    value: loc.id,
                    label: loc.name
                  }))
                ]}
              />
            )}

            <FormGrid columns={2}>
              <SelectField
                {...form.getFieldProps("budgetBand")}
                label="Budget Range"
                placeholder="Select budget"
                options={[
                  { value: "", label: "Any budget" },
                  ...Object.entries(budgetBandLabels).map(([value, label]) => ({
                    value,
                    label
                  }))
                ]}
              />

              <SelectField
                {...form.getFieldProps("moveInTimeframe")}
                label="Move-in Timeframe"
                placeholder="When do you need the space?"
                options={moveInOptions}
              />
            </FormGrid>
          </FormSection>

          {/* Advanced Options */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-muted py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/80"
            >
              {showAdvanced ? "Hide" : "Show"} Additional Options
            </button>

            {showAdvanced && (
              <FormSection title="Additional Details" className="rounded-lg bg-muted/30 p-4">
                <InputField
                  {...form.getFieldProps("company")}
                  label="Company Name"
                  placeholder="Your company name"
                  autoComplete="organization"
                />

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Requirements</h4>
                  <FormGrid columns={2}>
                    <SwitchField
                      {...form.getFieldProps("nearMetroPreferred")}
                      label="Near Metro Station"
                      checked={form.data.nearMetroPreferred || false}
                    />
                    
                    <SwitchField
                      {...form.getFieldProps("parkingNeeded")}
                      label="Parking Required"
                      checked={form.data.parkingNeeded || false}
                    />
                    
                    <SwitchField
                      {...form.getFieldProps("powerBackupRequired")}
                      label="Power Backup"
                      checked={form.data.powerBackupRequired || false}
                    />
                    
                    <SwitchField
                      {...form.getFieldProps("gstRequired")}
                      label="GST Invoice Required"
                      checked={form.data.gstRequired || false}
                    />
                    
                    <SwitchField
                      {...form.getFieldProps("meetingRoomsNeeded")}
                      label="Meeting Rooms Needed"
                      checked={form.data.meetingRoomsNeeded || false}
                    />
                  </FormGrid>
                </div>

                <TextareaField
                  {...form.getFieldProps("notes")}
                  label="Additional Notes"
                  placeholder="Any specific requirements or questions..."
                  rows={3}
                  maxLength={500}
                />
              </FormSection>
            )}
          </div>

          {/* Submit Button */}
          <LoadingButton
            type="submit"
            size="lg"
            className="w-full"
            loading={form.isSubmitting}
            loadingText="Submitting enquiry..."
            disabled={!form.isValid && Object.keys(form.touched).length > 0}
          >
            Submit Enquiry
          </LoadingButton>

          {/* Privacy Notice */}
          <p className="text-center text-xs text-muted-foreground">
            {transparencyLines.partnerFee}
          </p>
        </form>
      </CardContent>
    </Card>
  );
}