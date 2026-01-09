import { useParams, Link, useSearchParams, Navigate } from "react-router-dom";
import { ArrowLeft, Edit, CheckCircle, AlertCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePartnerListing, useUpdatePartnerListing } from "@/hooks/useAuth";
import { WorkspacePreview } from "@/components/WorkspacePreview";
import { StatusBadge } from "@/components/StatusBadge";
import { AdminNotesPanel } from "@/components/AdminNotesPanel";
import { WorkspaceForm } from "@/components/WorkspaceForm";
import { toast } from "sonner";

export function PartnerListingDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isEdit = searchParams.get("edit") === "true";
  const { data: listing, isLoading, error } = usePartnerListing(id!);
  const updateListingMutation = useUpdatePartnerListing();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading listing...</p>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return <Navigate to="/partner/listings" replace />;
  }

  const handleResubmit = async (data: any) => {
    try {
      // Map workspace types from frontend to backend format
      const workspaceTypeMapping = {
        "dedicated-desk": "DEDICATED_DESKS",
        "private-cabin": "PRIVATE_CABINS", 
        "managed-office": "MANAGED_OFFICE"
      };
      
      const availabilityStatusMapping = {
        "available": "AVAILABLE",
        "limited": "LIMITED",
        "waitlist": "WAITLIST"
      };
      
      const mappedWorkspaceTypes = data.workspaceTypes.map(type => workspaceTypeMapping[type] || type);
      const mappedAvailabilityStatus = availabilityStatusMapping[data.availabilityStatus] || data.availabilityStatus;

      const updateData = {
        displayName: data.displayName,
        brandHidden: false,
        locality: data.locality,
        workspaceTypes: mappedWorkspaceTypes,
        seatCapacityMin: data.seatCapacityMin,
        seatCapacityMax: data.seatCapacityMax,
        availabilityStatus: mappedAvailabilityStatus,
        budgetBandId: data.budgetBand,
        budgetDisplayText: data.budgetDisplayText?.trim() || "Contact for pricing",
        nearMetro: data.nearMetro || false,
        metroNote: data.nearMetro ? (data.metroNote || "Near Metro") : null,
        parking: data.parking || "NONE",
        powerBackup: data.powerBackup || false,
        gstInvoiceAvailable: false,
        accessHours: data.accessHours,
        weekendAccess: data.weekendAccess || false,
        amenities: data.amenities || [],
        meetingRoomsCount: data.meetingRoomsCount || null,
        meetingRoomsAddonOnly: data.meetingRoomsAddon || true,
        internetSpeedMbps: data.internetSpeedMbps || null,
        dealTags: data.dealTags || [],
        dealDetails: data.dealDetails?.trim() || null,
        dealEligibility: data.dealEligibility?.trim() || null,
        overview: data.overview,
        houseRules: data.houseRules?.trim() || null,
      };

      await updateListingMutation.mutateAsync({
        listingId: listing.listingId,
        data: updateData,
      });
      toast.success("Listing updated successfully!");
      window.location.href = `/partner/listings/${listing.listingId}`;
    } catch (error: any) {
      toast.error(error.message || "Failed to update listing");
    }
  };

  if (isEdit && (listing.verificationStatus === "NEEDS_INFO" || 
                 listing.verificationStatus === "PENDING_REVIEW" ||
                 listing.verificationStatus === "REJECTED")) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/partner/listings/${listing.listingId}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">Edit & Resubmit</h1>
            <p className="text-sm text-muted-foreground">{listing.displayName}</p>
          </div>
        </div>

        {listing.adminNotes && (
          <Card>
            <CardContent className="pt-6">
              <AdminNotesPanel draft={listing} />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6">
            <WorkspaceForm
              onSubmit={handleResubmit}
              initialData={{
                displayName: listing.displayName,
                localityId: listing.locality, // Map locality name to localityId for now
                workspaceTypes: listing.workspaceTypes.map(type => {
                  // Map backend format to frontend format
                  const mapping = {
                    "DEDICATED_DESKS": "dedicated-desk",
                    "PRIVATE_CABINS": "private-cabin",
                    "MANAGED_OFFICE": "managed-office"
                  };
                  return mapping[type] || type;
                }),
                photos: listing.photos?.map((p: any) => p.url || p) || [],
                seatCapacityMin: listing.seatCapacityMin,
                seatCapacityMax: listing.seatCapacityMax,
                availabilityStatus: listing.availabilityStatus.toLowerCase(),
                budgetBand: listing.budgetBandId,
                budgetDisplayText: listing.budgetDisplayText,
                nearMetro: listing.nearMetro,
                metroNote: listing.metroNote,
                parking: listing.parking,
                powerBackup: listing.powerBackup,
                weekendAccess: listing.weekendAccess,
                amenities: listing.amenities,
                overview: listing.overview,
                meetingRoomsAddon: listing.meetingRooms?.addonOnly || false,
                meetingRoomsCount: listing.meetingRooms?.count || 0,
                internetSpeedMbps: listing.internetSpeedMbps,
                dealTags: listing.dealTags || [],
                dealDetails: listing.dealDetails,
                dealEligibility: listing.dealEligibility,
                houseRules: listing.houseRules,
                accessHours: listing.accessHours,
              }}
              isLoading={updateListingMutation.isPending}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusMessages = {
    "PENDING_REVIEW": {
      icon: Clock,
      title: "Under Review",
      message: "Your listing is being reviewed. We'll respond within 24 hours.",
      className: "bg-accent/20 text-accent-foreground border-accent/30",
    },
    "NEEDS_INFO": {
      icon: AlertCircle,
      title: "Needs More Information",
      message: "Please review the admin notes below and resubmit your listing.",
      className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border-yellow-500/20",
    },
    "APPROVED_VERIFIED": {
      icon: CheckCircle,
      title: "Approved & Live",
      message: "Your listing has been approved and is now live on the public site!",
      className: "bg-success/10 text-success border-success/20",
    },
    "REJECTED": {
      icon: XCircle,
      title: "Rejected",
      message: "Your listing was rejected. Please review the reason below.",
      className: "bg-destructive/10 text-destructive border-destructive/20",
    },
    "SUSPENDED": {
      icon: XCircle,
      title: "Suspended",
      message: "Your listing has been suspended. Please contact support.",
      className: "bg-destructive/10 text-destructive border-destructive/20",
    },
  };

  const statusInfo = statusMessages[listing.verificationStatus] || statusMessages["PENDING_REVIEW"];
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/partner/listings">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="font-display text-xl font-bold text-foreground">{listing.displayName}</h1>
          <p className="text-sm text-muted-foreground">{listing.locality}, {listing.city}</p>
        </div>
        <StatusBadge status={listing.verificationStatus} />
      </div>

      {/* Status Banner */}
      <Card className={statusInfo.className}>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <StatusIcon className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold mb-1">{statusInfo.title}</h3>
              <p className="text-sm">{statusInfo.message}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Notes */}
      {(listing.verificationStatus === "NEEDS_INFO" || listing.verificationStatus === "REJECTED") && listing.adminNotes && (
        <AdminNotesPanel draft={listing} />
      )}

      {/* Preview */}
      <Card>
        <CardContent className="pt-6">
          <WorkspacePreview listing={listing} />
        </CardContent>
      </Card>

      {/* Actions */}
      {(listing.verificationStatus === "NEEDS_INFO" || 
        listing.verificationStatus === "PENDING_REVIEW" ||
        listing.verificationStatus === "REJECTED") && (
        <div className="flex gap-4">
          <Button asChild className="flex-1">
            <Link to={`/partner/listings/${listing.listingId}?edit=true`}>
              <Edit className="h-4 w-4" />
              Edit & Resubmit
            </Link>
          </Button>
        </div>
      )}

      {/* Activity History */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4">Activity History</h3>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm">
                  <span className="font-medium">Created</span> by partner
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(listing.createdAt).toLocaleString("en-IN")}
                </p>
              </div>
            </div>
            {listing.updatedAt !== listing.createdAt && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm">
                    <span className="font-medium">Updated</span> by partner
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(listing.updatedAt).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
