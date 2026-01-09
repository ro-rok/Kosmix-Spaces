import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  MapPin,
  Users,
  Clock,
  Car,
  Zap,
  Wifi,
  Coffee
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAdminListing, useApproveListing, useNeedsInfoListing, useRejectListing } from "@/hooks/useAuth";
import { toast } from "sonner";

export function AdminListingDetail() {
  const { listingId } = useParams<{ listingId: string }>();
  const [notes, setNotes] = useState("");
  const [reason, setReason] = useState("");

  const { data: listing, isLoading, error } = useAdminListing(listingId!);
  const approveMutation = useApproveListing();
  const needsInfoMutation = useNeedsInfoListing();
  const rejectMutation = useRejectListing();

  const handleApprove = async () => {
    if (!listing) return;
    
    try {
      await approveMutation.mutateAsync({ 
        listingId: listing.listingId, 
        notes: notes || `Approved by admin on ${new Date().toLocaleDateString()}` 
      });
      toast.success("Listing has been approved and published");
      setNotes("");
    } catch (error: any) {
      toast.error(`Failed to approve listing: ${error.message}`);
    }
  };

  const handleNeedsInfo = async () => {
    if (!listing || !notes.trim()) {
      toast.error("Please provide feedback for the partner");
      return;
    }

    try {
      await needsInfoMutation.mutateAsync({ 
        listingId: listing.listingId, 
        notes: notes.trim() 
      });
      toast.success("Listing marked as needs info");
      setNotes("");
    } catch (error: any) {
      toast.error(`Failed to update listing: ${error.message}`);
    }
  };

  const handleReject = async () => {
    if (!listing || !reason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    try {
      await rejectMutation.mutateAsync({ 
        listingId: listing.listingId, 
        reason: reason.trim() 
      });
      toast.success("Listing has been rejected");
      setReason("");
    } catch (error: any) {
      toast.error(`Failed to reject listing: ${error.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin/listings">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="font-display text-2xl font-bold">Loading...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin/listings">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="font-display text-2xl font-bold text-destructive">Error</h1>
            <p className="text-muted-foreground">Failed to load listing</p>
          </div>
        </div>
      </div>
    );
  }

  const specs = [
    { icon: Users, label: "Capacity", value: `${listing.seatCapacityMin}-${listing.seatCapacityMax} seats` },
    { icon: Clock, label: "Access", value: listing.accessHours },
    { icon: MapPin, label: "Metro", value: listing.nearMetro ? listing.metroNote || "Near Metro" : "Not near metro" },
    { icon: Car, label: "Parking", value: listing.parking !== "NONE" ? "Available" : "Not available" },
    { icon: Zap, label: "Power Backup", value: listing.powerBackup ? "Yes" : "No" },
  ];

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
          <h1 className="font-display text-2xl font-bold">{listing.displayName}</h1>
          <p className="text-muted-foreground">{listing.locality}, {listing.city}</p>
        </div>
        <StatusBadge status={listing.verificationStatus} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Photos */}
          {listing.photos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Photos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {listing.photos.map((photo, idx) => (
                    <img
                      key={idx}
                      src={photo.url}
                      alt=""
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{listing.overview}</p>
            </CardContent>
          </Card>

          {/* Specifications */}
          <Card>
            <CardHeader>
              <CardTitle>Specifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {specs.map((spec) => (
                  <div key={spec.label} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <spec.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{spec.label}</p>
                      <p className="font-medium">{spec.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Workspace Types */}
          <Card>
            <CardHeader>
              <CardTitle>Workspace Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {listing.workspaceTypes.map((type) => (
                  <Badge key={type} variant="outline">
                    {type.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Amenities */}
          <Card>
            <CardHeader>
              <CardTitle>Amenities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {listing.amenities.map((amenity) => (
                  <div key={amenity} className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10">
                      {amenity.toLowerCase().includes("wifi") ? (
                        <Wifi className="h-3 w-3 text-primary" />
                      ) : amenity.toLowerCase().includes("cafe") ? (
                        <Coffee className="h-3 w-3 text-primary" />
                      ) : (
                        <CheckCircle className="h-3 w-3 text-primary" />
                      )}
                    </div>
                    <span className="text-sm">{amenity}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Listing Info */}
          <Card>
            <CardHeader>
              <CardTitle>Listing Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Budget Band</p>
                <p className="font-medium">{listing.budgetDisplayText}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Availability</p>
                <p className="font-medium">{listing.availabilityStatus}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">{new Date(listing.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">{new Date(listing.updatedAt).toLocaleDateString()}</p>
              </div>
              {listing.publishedAt && (
                <div>
                  <p className="text-sm text-muted-foreground">Published</p>
                  <p className="font-medium">{new Date(listing.publishedAt).toLocaleDateString()}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Admin Actions */}
          {(listing.verificationStatus === "PENDING_REVIEW" || listing.verificationStatus === "NEEDS_INFO") && (
            <Card>
              <CardHeader>
                <CardTitle>Admin Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Approve */}
                <div className="space-y-2">
                  <Label htmlFor="approve-notes">Approval Notes (Optional)</Label>
                  <Textarea
                    id="approve-notes"
                    placeholder="Add any notes for approval..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                  <Button 
                    onClick={handleApprove}
                    disabled={approveMutation.isPending}
                    className="w-full"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {approveMutation.isPending ? "Approving..." : "Approve & Publish"}
                  </Button>
                </div>

                {/* Needs Info */}
                <div className="space-y-2">
                  <Label htmlFor="needs-info-notes">Feedback for Partner *</Label>
                  <Textarea
                    id="needs-info-notes"
                    placeholder="Explain what needs to be fixed or improved..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                  <Button 
                    onClick={handleNeedsInfo}
                    disabled={needsInfoMutation.isPending || !notes.trim()}
                    variant="outline"
                    className="w-full"
                  >
                    <AlertCircle className="h-4 w-4" />
                    {needsInfoMutation.isPending ? "Updating..." : "Request Changes"}
                  </Button>
                </div>

                {/* Reject */}
                <div className="space-y-2">
                  <Label htmlFor="reject-reason">Rejection Reason *</Label>
                  <Textarea
                    id="reject-reason"
                    placeholder="Explain why this listing is being rejected..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                  />
                  <Button 
                    onClick={handleReject}
                    disabled={rejectMutation.isPending || !reason.trim()}
                    variant="destructive"
                    className="w-full"
                  >
                    <XCircle className="h-4 w-4" />
                    {rejectMutation.isPending ? "Rejecting..." : "Reject Listing"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Admin Notes */}
          {listing.adminNotes && (
            <Card>
              <CardHeader>
                <CardTitle>Admin Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{listing.adminNotes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}