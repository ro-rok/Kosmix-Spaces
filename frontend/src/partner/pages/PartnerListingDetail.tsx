import { useParams, Link, useSearchParams, Navigate } from "react-router-dom";
import { ArrowLeft, Edit, CheckCircle, AlertCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getPartnerSession, getDraftById, updateListingDraft } from "@/lib/partnerStore";
import { WorkspacePreview } from "@/components/WorkspacePreview";
import { StatusBadge } from "@/components/StatusBadge";
import { AdminNotesPanel } from "@/components/AdminNotesPanel";
import { WorkspaceForm } from "@/components/WorkspaceForm";
import { toast } from "sonner";
import { useState } from "react";

export function PartnerListingDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isEdit = searchParams.get("edit") === "true";
  const session = getPartnerSession();
  const draft = id ? getDraftById(id) : null;
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!session || !draft || draft.partnerId !== session.partnerId) {
    return <Navigate to="/partner/listings" replace />;
  }

  const handleResubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      updateListingDraft(draft.draftId, {
        ...data,
        verificationStatus: "pending",
        adminNotes: undefined,
      });
      toast.success("Listing resubmitted successfully!");
      window.location.href = `/partner/listings/${draft.draftId}`;
    } catch (error) {
      toast.error("Failed to resubmit listing");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEdit && draft.verificationStatus === "needs-info") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/partner/listings/${draft.draftId}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">Edit & Resubmit</h1>
            <p className="text-sm text-muted-foreground">{draft.displayName}</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <AdminNotesPanel draft={draft} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <WorkspaceForm
              onSubmit={handleResubmit}
              initialData={{
                displayName: draft.displayName,
                localityId: draft.localityId,
                workspaceTypes: draft.workspaceTypes,
                photos: draft.photos,
                seatCapacityMin: draft.seatCapacityMin,
                seatCapacityMax: draft.seatCapacityMax,
                availabilityStatus: draft.availabilityStatus,
                budgetBand: draft.budgetBand,
                budgetDisplayText: draft.budgetDisplayText,
                nearMetro: draft.nearMetro,
                metroNote: draft.metroNote,
                parking: draft.parking,
                powerBackup: draft.powerBackup,
                gstInvoiceAvailable: draft.gstInvoiceAvailable,
                accessHours: draft.accessHours,
                amenities: draft.amenities,
                overview: draft.overview,
                meetingRoomsAddon: draft.meetingRoomsAddon,
                meetingRoomsCount: draft.meetingRoomsCount,
                internetSpeedMbps: draft.internetSpeedMbps,
                dealTags: draft.dealTags,
                dealDetails: draft.dealDetails,
                houseRules: draft.houseRules,
                highlights: draft.highlights,
              }}
              isLoading={isSubmitting}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusMessages = {
    pending: {
      icon: Clock,
      title: "Under Review",
      message: "Your listing is being reviewed. We'll respond within 24 hours.",
      className: "bg-accent/20 text-accent-foreground border-accent/30",
    },
    "needs-info": {
      icon: AlertCircle,
      title: "Needs More Information",
      message: "Please review the admin notes below and resubmit your listing.",
      className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border-yellow-500/20",
    },
    "approved-verified": {
      icon: CheckCircle,
      title: "Approved & Live",
      message: "Your listing has been approved and is now live on the public site!",
      className: "bg-success/10 text-success border-success/20",
    },
    rejected: {
      icon: XCircle,
      title: "Rejected",
      message: "Your listing was rejected. Please review the reason below.",
      className: "bg-destructive/10 text-destructive border-destructive/20",
    },
  };

  const statusInfo = statusMessages[draft.verificationStatus] || statusMessages.pending;
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
          <h1 className="font-display text-xl font-bold text-foreground">{draft.displayName}</h1>
          <p className="text-sm text-muted-foreground">{draft.locality}, {draft.city}</p>
        </div>
        <StatusBadge status={draft.verificationStatus} />
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
      {(draft.verificationStatus === "needs-info" || draft.verificationStatus === "rejected") && (
        <AdminNotesPanel draft={draft} />
      )}

      {/* Preview */}
      <Card>
        <CardContent className="pt-6">
          <WorkspacePreview listing={draft} />
        </CardContent>
      </Card>

      {/* Actions */}
      {draft.verificationStatus === "needs-info" && (
        <div className="flex gap-4">
          <Button asChild className="flex-1">
            <Link to={`/partner/listings/${draft.draftId}?edit=true`}>
              <Edit className="h-4 w-4" />
              Edit & Resubmit
            </Link>
          </Button>
        </div>
      )}

      {/* Audit Trail */}
      {draft.auditTrail && draft.auditTrail.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4">Activity History</h3>
            <div className="space-y-4">
              {draft.auditTrail.map((entry) => (
                <div key={entry.id} className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm">
                      <span className="font-medium">{entry.action}</span> by {entry.actorRole}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleString("en-IN")}
                    </p>
                    {entry.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{entry.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
