import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { WorkspaceForm } from "@/components/WorkspaceForm";
import { useCreatePartnerListing } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useLocalities } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { getStoredToken } from "@/hooks/useAuth";

export function SubmitListing() {
  const navigate = useNavigate();
  const createListingMutation = useCreatePartnerListing();
  
  const { data: localitiesData } = useLocalities();
  const localities = localitiesData || [];

  const handleSubmit = async (data: any) => {
    try {
      console.log("Form data received:", data);
      
      const selectedLocality = localities.find((l) => l.id === data.localityId);
      
      // Map workspace types to backend format
      const workspaceTypeMapping: Record<string, string> = {
        "dedicated-desk": "DEDICATED_DESKS",
        "private-cabin": "PRIVATE_CABINS", 
        "managed-office": "MANAGED_OFFICE"
      };
      
      const availabilityStatusMapping: Record<string, string> = {
        "available": "AVAILABLE",
        "limited": "LIMITED",
        "waitlist": "WAITLIST"
      };
      
      const parkingMapping: Record<string, string> = {
        "none": "NONE",
        "paid": "PAID",
        "free": "FREE",
        "both": "BOTH"
      };
      
      const mappedWorkspaceTypes = (data.workspaceTypes || []).map((type: string) => 
        workspaceTypeMapping[type] || type.toUpperCase()
      );
      const mappedAvailabilityStatus = availabilityStatusMapping[data.availabilityStatus] || 
        data.availabilityStatus?.toUpperCase() || "AVAILABLE";
      const mappedParking = parkingMapping[data.parking?.toLowerCase()] || 
        data.parking?.toUpperCase() || "NONE";
      
      // First create the listing without photos - use minimal required data
      const listingData = {
        displayName: String(data.displayName).trim(),
        brandHidden: false,
        locality: String(selectedLocality?.name || "").trim(),
        workspaceTypes: mappedWorkspaceTypes.length > 0 ? mappedWorkspaceTypes : ["DEDICATED_DESKS"],
        seatCapacityMin: Math.max(1, parseInt(String(data.seatCapacityMin)) || 1),
        seatCapacityMax: Math.max(1, parseInt(String(data.seatCapacityMax)) || 1),
        availabilityStatus: mappedAvailabilityStatus,
        budgetBandId: String(data.budgetBand || data.budgetBandId || "contact-for-pricing").trim(),
        budgetDisplayText: String(data.budgetDisplayText || "Contact for pricing").trim(),
        nearMetro: Boolean(data.nearMetro),
        metroNote: data.nearMetro && data.metroNote ? String(data.metroNote).trim() : null,
        parking: mappedParking,
        powerBackup: Boolean(data.powerBackup),
        gstInvoiceAvailable: Boolean(data.gstInvoiceAvailable),
        accessHours: String(data.accessHours || "9 AM - 6 PM").trim(),
        weekendAccess: Boolean(data.weekendAccess),
        amenities: Array.isArray(data.amenities) ? data.amenities.filter(Boolean) : [],
        meetingRoomsCount: data.meetingRoomsCount && !isNaN(parseInt(String(data.meetingRoomsCount))) ? 
          parseInt(String(data.meetingRoomsCount)) : null,
        meetingRoomsAddonOnly: Boolean(data.meetingRoomsAddon !== false),
        internetSpeedMbps: data.internetSpeedMbps && !isNaN(parseInt(String(data.internetSpeedMbps))) ? 
          parseInt(String(data.internetSpeedMbps)) : null,
        dealTags: Array.isArray(data.dealTags) ? data.dealTags.filter(Boolean) : [],
        dealDetails: data.dealDetails && String(data.dealDetails).trim() ? String(data.dealDetails).trim() : null,
        dealEligibility: data.dealEligibility && String(data.dealEligibility).trim() ? String(data.dealEligibility).trim() : null,
        overview: String(data.overview || "").trim(),
        houseRules: data.houseRules && String(data.houseRules).trim() ? String(data.houseRules).trim() : null,
      };

      console.log("Listing data to send:", listingData);
      console.log("Listing data JSON:", JSON.stringify(listingData, null, 2));

      // Validate required fields before sending
      const requiredFields = {
        displayName: listingData.displayName,
        locality: listingData.locality,
        overview: listingData.overview,
        accessHours: listingData.accessHours,
        workspaceTypes: listingData.workspaceTypes,
        budgetBandId: listingData.budgetBandId
      };

      const missingFields = Object.entries(requiredFields)
        .filter(([key, value]) => !value || (Array.isArray(value) && value.length === 0))
        .map(([key]) => key);

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Validate data types
      if (listingData.seatCapacityMin < 1 || listingData.seatCapacityMax < 1) {
        throw new Error("Seat capacity must be at least 1");
      }

      if (listingData.seatCapacityMin > listingData.seatCapacityMax) {
        throw new Error("Minimum seat capacity cannot be greater than maximum");
      }

      console.log("About to send request with validated data:", listingData);

      const result = await createListingMutation.mutateAsync(listingData);
      
      // Upload photos if any
      if (data.photos && data.photos.length > 0) {
        const token = getStoredToken();
        let uploadedCount = 0;
        
        for (const photo of data.photos) {
          try {
            console.log(`Uploading photo: ${photo.name}, size: ${photo.size}, type: ${photo.type}`);
            
            const formData = new FormData();
            formData.append('file', photo);
            
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}/api/partner/listings/${result.listingId}/photos`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                // Don't set Content-Type for FormData - let browser set it with boundary
              },
              body: formData,
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error(`Failed to upload photo: ${photo.name}`, {
                status: response.status,
                statusText: response.statusText,
                error: errorText
              });
              throw new Error(`Failed to upload photo: ${photo.name} (${response.status})`);
            }
            
            const uploadResult = await response.json();
            console.log(`Photo uploaded successfully: ${photo.name}`, uploadResult);
            uploadedCount++;
          } catch (photoError) {
            console.error("Photo upload error:", {
              photoName: photo.name,
              error: photoError,
              message: photoError instanceof Error ? photoError.message : String(photoError)
            });
            // Continue with other photos
          }
        }

        if (uploadedCount === data.photos.length) {
          toast.success("Listing created and all photos uploaded successfully!");
        } else if (uploadedCount > 0) {
          toast.warning(`Listing created! ${uploadedCount}/${data.photos.length} photos uploaded successfully.`);
        } else {
          toast.warning("Listing created but photos failed to upload. You can add them later.");
        }
      } else {
        toast.success("Listing created successfully! You can add photos later.");
      }

      navigate(`/partner/listings/${result.listingId}`);
    } catch (error: any) {
      console.error("Submission error:", error);
      console.error("Error details:", {
        message: error.message,
        status: error.status,
        stack: error.stack
      });
      
      // Try to extract validation details from the error
      let errorMessage = "Failed to submit listing. Please try again.";
      
      if (error.message) {
        // Check if it's a detailed validation error
        if (error.message.includes("VALIDATION_ERROR") || error.status === 422) {
          errorMessage = "Validation error: Please check all required fields. See console for details.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/partner/listings">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Submit New Listing</h1>
          <p className="text-muted-foreground">Fill in the details of your workspace</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workspace Information</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkspaceForm onSubmit={handleSubmit} isLoading={createListingMutation.isPending} />
        </CardContent>
      </Card>
    </div>
  );
}
