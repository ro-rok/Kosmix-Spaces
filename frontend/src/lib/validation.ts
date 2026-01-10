/**
 * Zod validation schemas for forms
 */

import { z } from "zod";
import { OfferingType } from "@/types/models";

// Common validation patterns
const phoneRegex = /^\+91-[0-9]{10}$/;
const emailSchema = z.string().email("Please enter a valid email address");
const phoneSchema = z.string().regex(phoneRegex, "Phone must be in format +91-XXXXXXXXXX");

// Partner registration schema
export const partnerRegistrationSchema = z.object({
  workspaceBrandName: z.string()
    .min(2, "Workspace name must be at least 2 characters")
    .max(100, "Workspace name must be less than 100 characters"),
  contactName: z.string()
    .min(2, "Contact name must be at least 2 characters")
    .max(50, "Contact name must be less than 50 characters"),
  phone: phoneSchema,
  email: emailSchema,
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export type PartnerRegistrationData = z.infer<typeof partnerRegistrationSchema>;

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export type LoginData = z.infer<typeof loginSchema>;

// Lead/Enquiry schema
export const leadSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters"),
  phone: phoneSchema,
  email: emailSchema.optional(),
  company: z.string().max(100, "Company name must be less than 100 characters").optional(),
  preferredLocalities: z.array(z.string()).min(1, "Please select at least one locality"),
  teamSizeBand: z.string().min(1, "Please select team size"),
  budgetBandId: z.string().min(1, "Please select budget range"),
  spaceType: z.string().min(1, "Please select space type"),
  moveInTimeframe: z.string().optional(),
  meetingRoomsNeeded: z.boolean().optional(),
  gstRequired: z.boolean().optional(),
  parkingNeeded: z.boolean().optional(),
  powerBackupRequired: z.boolean().optional(),
  nearMetroPreferred: z.boolean().optional(),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional(),
});

export type LeadData = z.infer<typeof leadSchema>;

// Site visit schema
export const siteVisitSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters"),
  phone: phoneSchema,
  email: emailSchema.optional(),
  listingIds: z.array(z.string()).min(1, "Please select at least one listing"),
  preferredSlots: z.array(z.object({
    date: z.string().min(1, "Date is required"),
    timeSlot: z.string().min(1, "Time slot is required"),
  })).min(1, "Please select at least one preferred slot"),
  visitorCount: z.number().min(1, "Visitor count must be at least 1").max(20, "Maximum 20 visitors allowed"),
});

export type SiteVisitData = z.infer<typeof siteVisitSchema>;

// Offering schema for listing builder
export const offeringSchema = z.object({
  type: z.enum(["private-offices", "dedicated-desks", "hot-desks", "meeting-rooms", "event-spaces"]),
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  features: z.array(z.string()).optional(),
  startingPrice: z.number().positive("Price must be positive").optional(),
  unit: z.enum(["month", "hr", "NA"]).optional(),
  budgetBand: z.string().optional(),
  enabled: z.boolean(),
  photos: z.array(z.string()).optional(),
});

export type OfferingFormData = z.infer<typeof offeringSchema>;

// Offering validation with photo requirements
export const offeringWithPhotosSchema = offeringSchema.refine(
  (data) => {
    // If offering is enabled, it must have at least 1 photo
    if (data.enabled && (!data.photos || data.photos.length === 0)) {
      return false;
    }
    return true;
  },
  {
    message: "Enabled offerings must have at least 1 photo",
    path: ["photos"],
  }
);

// Basic listing info schema
export const basicListingInfoSchema = z.object({
  displayName: z.string()
    .min(2, "Display name must be at least 2 characters")
    .max(100, "Display name must be less than 100 characters"),
  locality: z.string().min(1, "Locality is required"),
  city: z.string().min(1, "City is required"),
  overview: z.string()
    .min(10, "Overview must be at least 10 characters")
    .max(1000, "Overview must be less than 1000 characters"),
  amenities: z.array(z.string()).optional(),
  accessHours: z.string().optional(),
  weekendAccess: z.boolean().optional(),
});

export type BasicListingInfoData = z.infer<typeof basicListingInfoSchema>;

// Location schema
export const locationSchema = z.object({
  locality: z.string().min(1, "Locality is required"),
  city: z.string().min(1, "City is required"),
  approximateCoordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }).optional(),
});

export type LocationData = z.infer<typeof locationSchema>;

// Complete listing schema
export const listingSchema = z.object({
  basicInfo: basicListingInfoSchema,
  offerings: z.record(offeringWithPhotosSchema),
  location: locationSchema,
});

export type ListingFormData = z.infer<typeof listingSchema>;

// Listing submission validation (requires at least one enabled offering with photos)
export const listingSubmissionSchema = listingSchema.refine(
  (data) => {
    const enabledOfferings = Object.values(data.offerings).filter(offering => offering.enabled);
    if (enabledOfferings.length === 0) {
      return false;
    }
    
    // Check that all enabled offerings have at least 1 photo
    return enabledOfferings.every(offering => 
      offering.photos && offering.photos.length > 0
    );
  },
  {
    message: "At least one offering must be enabled with photos before submission",
    path: ["offerings"],
  }
);

// Search filters schema
export const searchFiltersSchema = z.object({
  locality: z.array(z.string()).optional(),
  teamSize: z.string().optional(),
  budgetBand: z.array(z.string()).optional(),
  meetingRooms: z.boolean().optional(),
  privateOffice: z.boolean().optional(),
  verifiedOnly: z.boolean().optional(),
  amenities: z.array(z.string()).optional(),
});

export type SearchFiltersData = z.infer<typeof searchFiltersSchema>;

// Validation helper functions
export function validateField<T>(schema: z.ZodSchema<T>, value: unknown): {
  success: boolean;
  data?: T;
  error?: string;
} {
  try {
    const result = schema.parse(value);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || "Validation failed" };
    }
    return { success: false, error: "Validation failed" };
  }
}

export function getFieldError(errors: z.ZodError, fieldName: string): string | undefined {
  const fieldError = errors.errors.find(error => 
    error.path.length > 0 && error.path[0] === fieldName
  );
  return fieldError?.message;
}