import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { WorkspaceForm } from "@/components/WorkspaceForm";
import { getPartnerSession, submitListingDraft } from "@/lib/partnerStore";
import { toast } from "sonner";
import { useState } from "react";
import { useLocalities } from "@/hooks/useApi";

export function SubmitListing() {
  const navigate = useNavigate();
  const session = getPartnerSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: localitiesData } = useLocalities();
  const localities = localitiesData || [];

  if (!session) {
    return null;
  }

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const selectedLocality = localities.find((l) => l.id === data.localityId);
      
      const draft = submitListingDraft(session.partnerId, {
        displayName: data.displayName,
        locality: selectedLocality?.name || "",
        localityId: data.localityId,
        city: selectedLocality?.city || "Delhi",
        workspaceTypes: data.workspaceTypes,
        photos: data.photos.filter((url: string) => url.trim() !== ""),
        seatCapacityMin: data.seatCapacityMin,
        seatCapacityMax: data.seatCapacityMax,
        availabilityStatus: data.availabilityStatus,
        budgetBand: data.budgetBand,
        pricingMode: "on-enquiry",
        nearMetro: data.nearMetro,
        metroNote: data.metroNote || undefined,
        parking: data.parking,
        powerBackup: data.powerBackup,
        gstInvoiceAvailable: data.gstInvoiceAvailable,
        accessHours: data.accessHours,
        amenities: data.amenities,
        meetingRoomsAddon: data.meetingRoomsAddon || false,
        dealTags: data.dealTags || [],
        highlights: data.highlights || [],
        overview: data.overview,
      });

      toast.success("Listing submitted successfully! We'll review and respond within 24 hours.");
      navigate(`/partner/listings/${draft.draftId}`);
    } catch (error) {
      toast.error("Failed to submit listing. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
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
          <WorkspaceForm onSubmit={handleSubmit} isLoading={isSubmitting} />
        </CardContent>
      </Card>
    </div>
  );
}
