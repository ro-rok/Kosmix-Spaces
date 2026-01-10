import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminNotesPanelProps {
  listing: any; // Backend listing format with admin notes
}

export function AdminNotesPanel({ listing }: AdminNotesPanelProps) {
  if (listing.verificationStatus !== "needs-info" && listing.verificationStatus !== "rejected" &&
      listing.verificationStatus !== "NEEDS_INFO" && listing.verificationStatus !== "REJECTED") {
    return null;
  }

  const checklist = listing.verificationChecklist || {
    partnerContactVerified: false,
    photosVerified: false,
    specsVerified: false,
    pricingStructureConfirmed: false,
    addressHidingConfirmed: false,
  };

  const missingChecks = Object.entries(checklist)
    .filter(([_, checked]) => !checked)
    .map(([key]) => {
      const labels: Record<string, string> = {
        partnerContactVerified: "Partner contact verification",
        photosVerified: "Photo verification",
        specsVerified: "Specifications verification",
        pricingStructureConfirmed: "Pricing structure confirmation",
        addressHidingConfirmed: "Address hiding policy confirmation",
      };
      return labels[key] || key;
    });

  const isNeedsInfo = listing.verificationStatus === "needs-info" || listing.verificationStatus === "NEEDS_INFO";
  const isRejected = listing.verificationStatus === "rejected" || listing.verificationStatus === "REJECTED";

  return (
    <div className="space-y-4">
      {isNeedsInfo && (
        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold text-foreground">Additional Information Required</h3>
              {listing.adminNotes && (
                <p className="text-sm text-muted-foreground">{listing.adminNotes}</p>
              )}
              {missingChecks.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-medium text-foreground">Missing verifications:</p>
                  <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                    {missingChecks.map((check, idx) => (
                      <li key={idx}>{check}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isRejected && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold text-foreground">Listing Rejected</h3>
              {(listing.rejectionReason || listing.adminNotes) && (
                <p className="text-sm text-muted-foreground">
                  {listing.rejectionReason || listing.adminNotes}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
