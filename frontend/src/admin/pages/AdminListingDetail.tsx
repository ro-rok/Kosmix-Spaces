import { useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  MapPin,
  BadgeCheck,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { mockAdminListings } from "@/admin/mockData";
import { budgetBandLabels, workspaceTypeLabels } from "@/data/listings";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function AdminListingDetail() {
  const { slug } = useParams<{ slug: string }>();
  const listing = mockAdminListings.find((l) => l.slug === slug);
  
  const [checklist, setChecklist] = useState(listing?.verificationChecklist || {
    partnerContactVerified: false,
    photosVerified: false,
    specsVerified: false,
    pricingStructureConfirmed: false,
    addressHidingConfirmed: false,
  });
  const [rejectReason, setRejectReason] = useState("");
  const [needsInfoNotes, setNeedsInfoNotes] = useState("");

  if (!listing) {
    return <Navigate to="/admin/listings" replace />;
  }

  const allChecked = Object.values(checklist).every(Boolean);

  const handleApprove = () => {
    if (!allChecked) {
      toast.error("Complete all verification checks first");
      return;
    }
    toast.success(`${listing.displayName} has been approved`);
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    toast.success(`${listing.displayName} has been rejected`);
  };

  const handleNeedsInfo = () => {
    if (!needsInfoNotes.trim()) {
      toast.error("Please provide notes for the partner");
      return;
    }
    toast.success("Request for information sent to partner");
  };

  const checklistItems = [
    { key: "partnerContactVerified", label: "Partner contact verified" },
    { key: "photosVerified", label: "Photos are authentic and current" },
    { key: "specsVerified", label: "Specifications match reality" },
    { key: "pricingStructureConfirmed", label: "Pricing structure confirmed" },
    { key: "addressHidingConfirmed", label: "Address hiding policy confirmed" },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/admin/listings">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="font-display text-xl font-bold text-foreground">{listing.displayName}</h1>
          <p className="text-sm text-muted-foreground">{listing.locality}, {listing.city}</p>
        </div>
        <span className={cn(
          "text-xs px-3 py-1 rounded-full capitalize",
          listing.adminStatus === "approved" && "bg-success/10 text-success",
          listing.adminStatus === "pending" && "bg-accent/20 text-accent-foreground",
          listing.adminStatus === "rejected" && "bg-destructive/10 text-destructive",
        )}>
          {listing.adminStatus}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Preview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Photos */}
          <div className="rounded-lg border border-border overflow-hidden">
            <img
              src={listing.photos[0]}
              alt={listing.displayName}
              className="w-full aspect-[16/10] object-cover"
            />
            {listing.photos.length > 1 && (
              <div className="flex gap-2 p-2 bg-muted">
                {listing.photos.slice(1).map((photo, idx) => (
                  <img
                    key={idx}
                    src={photo}
                    alt=""
                    className="h-16 w-24 object-cover rounded"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <h3 className="font-semibold">Listing Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Budget Band</p>
                <p className="font-medium">{budgetBandLabels[listing.budgetBand]}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Capacity</p>
                <p className="font-medium">{listing.seatCapacityMin}-{listing.seatCapacityMax} seats</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Space Types</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {listing.workspaceTypes.map((type) => (
                    <span key={type} className="text-xs bg-muted px-2 py-0.5 rounded">
                      {workspaceTypeLabels[type]}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Access Hours</p>
                <p className="font-medium">{listing.accessHours}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Overview</p>
              <p className="mt-1 text-sm">{listing.overview}</p>
            </div>
          </div>

          {/* Audit Trail */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="font-semibold mb-4">Audit Trail</h3>
            <div className="space-y-4">
              {listing.auditTrail.map((entry) => (
                <div key={entry.id} className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm">
                      <span className="font-medium">{entry.action}</span> by {entry.user}
                    </p>
                    <p className="text-xs text-muted-foreground">{entry.timestamp}</p>
                    {entry.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{entry.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Verification Panel */}
        <div className="space-y-6">
          {/* Checklist */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="font-semibold mb-4">Verification Checklist</h3>
            <div className="space-y-3">
              {checklistItems.map((item) => (
                <div key={item.key} className="flex items-center gap-3">
                  <Checkbox
                    id={item.key}
                    checked={checklist[item.key]}
                    onCheckedChange={(checked) => 
                      setChecklist({ ...checklist, [item.key]: checked as boolean })
                    }
                  />
                  <label htmlFor={item.key} className="text-sm cursor-pointer">
                    {item.label}
                  </label>
                </div>
              ))}
            </div>
            {allChecked && (
              <div className="mt-4 flex items-center gap-2 text-success text-sm">
                <CheckCircle className="h-4 w-4" />
                All checks passed
              </div>
            )}
          </div>

          {/* Actions */}
          {listing.adminStatus === "pending" && (
            <div className="rounded-lg border border-border bg-card p-6 space-y-3">
              <h3 className="font-semibold">Actions</h3>
              
              <Button 
                onClick={handleApprove}
                className="w-full bg-success hover:bg-success/90"
                disabled={!allChecked}
              >
                <CheckCircle className="h-4 w-4" />
                Approve Listing
              </Button>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <XCircle className="h-4 w-4" />
                    Reject Listing
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reject Listing</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <Textarea
                      placeholder="Provide reason for rejection..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={4}
                    />
                    <Button variant="destructive" onClick={handleReject} className="w-full">
                      Confirm Rejection
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <AlertCircle className="h-4 w-4" />
                    Needs More Info
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request Information</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <Textarea
                      placeholder="What information is needed from the partner?"
                      value={needsInfoNotes}
                      onChange={(e) => setNeedsInfoNotes(e.target.value)}
                      rows={4}
                    />
                    <Button onClick={handleNeedsInfo} className="w-full">
                      Send Request
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* Quick Info */}
          <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">No address shown to public</span>
            </div>
            <div className="flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Badge shown only after approval</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
