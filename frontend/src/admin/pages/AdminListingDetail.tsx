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
  Camera,
  Building,
  Calendar,
  Shield,
  Globe,
  Phone,
  Mail,
  Star,
  Eye,
  MessageSquare
} from "lucide-react";
import { getAmenityIcon } from "@/lib/amenity-icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAdminPremiumListing, useApprovePremiumListing, useNeedsInfoPremiumListing, useRejectPremiumListing } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ApprovalWarningDialog } from "@/components/ApprovalWarningDialog";

export function AdminListingDetail() {
  const { listingId } = useParams<{ listingId: string }>();
  const [notes, setNotes] = useState("");
  const [reason, setReason] = useState("");
  const [showApprovalWarning, setShowApprovalWarning] = useState(false);

  // Get the premium listing
  const { data: listing, isLoading, error } = useAdminPremiumListing(listingId!);
  const approveMutation = useApprovePremiumListing();
  const needsInfoMutation = useNeedsInfoPremiumListing();
  const rejectMutation = useRejectPremiumListing();

  const handleApproveClick = () => {
    // Show warning dialog before approving
    setShowApprovalWarning(true);
  };

  const handleApprove = async () => {
    if (!listing) return;
    
    setShowApprovalWarning(false);
    
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

  // Get enabled offerings
  const enabledOfferings = Object.entries(listing.offerings || {}).filter(([_, offering]) => (offering as any).enabled);
  
  // Get all photos count
  const heroPhotosCount = listing.heroPhotos?.length || 0;
  const offeringPhotosCount = enabledOfferings.reduce((total, [_, offering]) => total + ((offering as any).photos?.length || 0), 0);
  const totalPhotos = heroPhotosCount + offeringPhotosCount;

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
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold">{listing.displayName}</h1>
            {(listing as any).wasReEdited && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                <AlertCircle className="h-3 w-3 mr-1" />
                Re-edited
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">{listing.locality}, {listing.city}</p>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {listing.viewCount || 0} views
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              {listing.enquiryCount || 0} enquiries
            </div>
            <div className="flex items-center gap-1">
              <Camera className="h-4 w-4" />
              {totalPhotos} photos
            </div>
            {(listing as any).reEditedAt && (
              <div className="flex items-center gap-1 text-yellow-600">
                <Clock className="h-4 w-4" />
                Edited: {new Date((listing as any).reEditedAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
        <StatusBadge status={listing.verificationStatus} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hero Photos */}
          {listing.heroPhotos && listing.heroPhotos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Hero Photos ({listing.heroPhotos.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {listing.heroPhotos.map((photo, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={photo.url}
                        alt={`Hero photo ${idx + 1}`}
                        className="w-full h-48 object-cover rounded-lg border"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg" />
                      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {photo.width}×{photo.height}
                      </div>
                    </div>
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
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{listing.overview}</p>
            </CardContent>
          </Card>

          {/* Offerings */}
          {enabledOfferings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Offerings ({enabledOfferings.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {enabledOfferings.map(([offeringType, offering]) => (
                  <div key={offeringType} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-lg">{(offering as any).title}</h4>
                        <p className="text-sm text-muted-foreground capitalize">{offeringType.replace('-', ' ')}</p>
                      </div>
                      <div className="text-right">
                        {(offering as any).startingPrice && (
                          <div className="font-semibold text-lg">
                            ₹{(offering as any).startingPrice.toLocaleString()}
                            {(offering as any).unit && <span className="text-sm text-muted-foreground">/{(offering as any).unit}</span>}
                          </div>
                        )}
                        {(offering as any).budgetBand && (
                          <Badge variant="outline">{(offering as any).budgetBand}</Badge>
                        )}
                      </div>
                    </div>

                    {(offering as any).description && (
                      <p className="text-muted-foreground">{(offering as any).description}</p>
                    )}

                    {(offering as any).features && (offering as any).features.length > 0 && (
                      <div>
                        <h5 className="font-medium mb-2">Features</h5>
                        <div className="flex flex-wrap gap-2">
                          {(offering as any).features.map((feature: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {(offering as any).capacity && (
                      <div>
                        <h5 className="font-medium mb-2">Capacity</h5>
                        <div className="text-sm text-muted-foreground">
                          {JSON.stringify((offering as any).capacity, null, 2)}
                        </div>
                      </div>
                    )}

                    {(offering as any).availability && (
                      <div>
                        <h5 className="font-medium mb-2">Availability</h5>
                        <p className="text-sm text-muted-foreground">{(offering as any).availability}</p>
                      </div>
                    )}

                    {(offering as any).photos && (offering as any).photos.length > 0 && (
                      <div>
                        <h5 className="font-medium mb-2">Photos ({(offering as any).photos.length})</h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {(offering as any).photos.map((photo: any, idx: number) => (
                            <div key={idx} className="relative group">
                              <img
                                src={photo.url}
                                alt={`${(offering as any).title} photo ${idx + 1}`}
                                className="w-full h-32 object-cover rounded border"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded" />
                              <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded">
                                {photo.width}×{photo.height}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Location Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location & Access
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Locality</p>
                  <p className="font-medium">{listing.locality}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">City</p>
                  <p className="font-medium">{listing.city}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Access Hours</p>
                  <p className="font-medium">{listing.accessHours || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Weekend Access</p>
                  <p className="font-medium">{listing.weekendAccess ? "Available" : "Not available"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">24/7 Access</p>
                  <p className="font-medium">{listing.twentyFourSevenAccess ? "Yes" : "No"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Near Metro</p>
                  <p className="font-medium">{listing.nearMetro ? "Yes" : "No"}</p>
                </div>
              </div>

              {listing.metroNote && (
                <div>
                  <p className="text-sm text-muted-foreground">Metro Information</p>
                  <p className="font-medium">{listing.metroNote}</p>
                </div>
              )}

              {listing.metroDetails && (
                <div>
                  <p className="text-sm text-muted-foreground">Metro Details</p>
                  <p className="font-medium">{listing.metroDetails}</p>
                </div>
              )}

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Parking</p>
                  <p className="font-medium">{listing.parking || "Not available"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Power Backup</p>
                  <p className="font-medium">{listing.powerBackup ? "Available" : "Not available"}</p>
                </div>
                {listing.internetSpeedMbps && (
                  <div>
                    <p className="text-sm text-muted-foreground">Internet Speed</p>
                    <p className="font-medium">{listing.internetSpeedMbps} Mbps</p>
                  </div>
                )}
              </div>

              {listing.parkingNotes && (
                <div>
                  <p className="text-sm text-muted-foreground">Parking Notes</p>
                  <p className="font-medium">{listing.parkingNotes}</p>
                </div>
              )}

              {listing.wifiDetails && (
                <div>
                  <p className="text-sm text-muted-foreground">WiFi Details</p>
                  <p className="font-medium">{listing.wifiDetails}</p>
                </div>
              )}

              {listing.houseRules && (
                <div>
                  <p className="text-sm text-muted-foreground">House Rules</p>
                  <p className="font-medium whitespace-pre-wrap">{listing.houseRules}</p>
                </div>
              )}

              {listing.specialInstructions && (
                <div>
                  <p className="text-sm text-muted-foreground">Special Instructions</p>
                  <p className="font-medium whitespace-pre-wrap">{listing.specialInstructions}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Amenities */}
          {listing.amenities && listing.amenities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Amenities ({listing.amenities.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {listing.amenities.map((amenity) => {
                    const IconComponent = getAmenityIcon(amenity);
                    return (
                      <div key={amenity} className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10">
                          <IconComponent className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-sm">{amenity}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Highlights */}
          {listing.highlights && listing.highlights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Highlights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {listing.highlights.map((highlight, idx) => (
                    <Badge key={idx} variant="outline" className="text-sm">
                      {highlight}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
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
                <p className="text-sm text-muted-foreground">Listing ID</p>
                <p className="font-mono text-sm">{listing.listingId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Slug</p>
                <p className="font-mono text-sm">{listing.slug}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Availability</p>
                <Badge 
                  variant={listing.availabilityStatus === 'available' ? 'default' : 'secondary'}
                  className={listing.availabilityStatus === 'available' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600 text-white'}
                >
                  {listing.availabilityStatus === 'available' ? 'Available' : 
                   listing.availabilityStatus === 'unavailable' ? 'Unavailable' :
                   listing.availabilityStatus === 'limited' ? 'Limited' : 'Waitlist'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Published</p>
                <p className="font-medium">{listing.isPublished ? "Yes" : "No"}</p>
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
                  <p className="text-sm text-muted-foreground">Published At</p>
                  <p className="font-medium">{new Date(listing.publishedAt).toLocaleDateString()}</p>
                </div>
              )}
              {listing.lastViewedAt && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Viewed</p>
                  <p className="font-medium">{new Date(listing.lastViewedAt).toLocaleDateString()}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Admin Actions */}
          {(listing.verificationStatus === "PENDING_REVIEW" || 
            listing.verificationStatus === "PENDING" || 
            listing.verificationStatus === "SUBMITTED" || 
            listing.verificationStatus === "NEEDS_INFO") && (
            <Card>
              <CardHeader>
                <CardTitle>Admin Actions</CardTitle>
                <p className="text-sm text-muted-foreground">Current Status: {listing.verificationStatus}</p>
                {(listing as any).wasReEdited && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-semibold">Listing was re-edited</p>
                        <p>This listing was previously approved but has been edited by the partner. Please review all changes carefully before re-approving.</p>
                      </div>
                    </div>
                  </div>
                )}
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
                    onClick={handleApproveClick}
                    disabled={approveMutation.isPending}
                    className="w-full"
                    variant="default"
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
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{listing.adminNotes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Approval Warning Dialog */}
      <ApprovalWarningDialog
        open={showApprovalWarning}
        onOpenChange={setShowApprovalWarning}
        onConfirm={handleApprove}
        isLoading={approveMutation.isPending}
        listingName={listing.displayName}
      />
    </div>
  );
}