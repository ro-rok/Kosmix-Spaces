import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Edit, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  MapPin,
  Clock,
  Camera,
  Building,
  Star,
  Eye,
  MessageSquare
} from "lucide-react";
import { getAmenityIcon } from "@/lib/amenity-icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { Separator } from "@/components/ui/separator";
import { ListingBuilder } from "@/components/ListingBuilder";
import { AdminNotesPanel } from "@/components/AdminNotesPanel";
import { usePartnerListing } from "@/hooks/useAuth";

export function PartnerListingDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEdit = searchParams.get('edit') === 'true';

  console.log("PartnerListingDetail debug:", {
    id,
    isEdit,
    urlParams: useParams(),
    searchParams: Object.fromEntries(searchParams.entries())
  });

  const { data: listing, isLoading, error } = usePartnerListing(id || '');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/partner/listings">
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
            <Link to="/partner/listings">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="font-display text-2xl font-bold text-destructive">Listing Not Found</h1>
            <p className="text-muted-foreground">The requested listing could not be found</p>
          </div>
        </div>
      </div>
    );
  }

  // If in edit mode, show the listing builder
  if (isEdit) {
    return <ListingBuilder listingId={id} isEdit={true} />;
  }

  // Get enabled offerings
  const enabledOfferings = Object.entries(listing.offerings || {}).filter(([_, offering]: [string, any]) => offering?.enabled);
  
  // Get all photos count
  const heroPhotosCount = listing.heroPhotos?.length || 0;
  const offeringPhotosCount = enabledOfferings.reduce((total, [_, offering]: [string, any]) => total + (offering?.photos?.length || 0), 0);
  const totalPhotos = heroPhotosCount + offeringPhotosCount;

  // Check if partner can edit
  const canEdit = listing.verificationStatus === 'NEEDS_INFO' || 
                  listing.verificationStatus === 'PENDING_REVIEW' ||
                  listing.verificationStatus === 'PENDING' ||
                  listing.verificationStatus === 'REJECTED' ||
                  listing.status === 'pending';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/partner/listings">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold">{listing.displayName}</h1>
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
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={listing.verificationStatus} />
          {canEdit && (
            <Button onClick={() => navigate(`/partner/listings/${id}?edit=true`)}>
              <Edit className="h-4 w-4" />
              {listing.verificationStatus === 'NEEDS_INFO' ? 'Edit & Resubmit' : 'Edit'}
            </Button>
          )}
        </div>
      </div>

      {/* Admin Notes Panel - Show if needs info or rejected */}
      {(listing.verificationStatus === 'NEEDS_INFO' || listing.verificationStatus === 'REJECTED') && listing.adminNotes && (
        <AdminNotesPanel listing={listing} />
      )}

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
                  {listing.heroPhotos.map((photo: any, idx: number) => (
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
                {enabledOfferings.map(([offeringType, offering]: [string, any]) => (
                  <div key={offeringType} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-lg">{offering.title}</h4>
                        <p className="text-sm text-muted-foreground capitalize">{offeringType.replace('-', ' ')}</p>
                      </div>
                      <div className="text-right">
                        {offering.startingPrice && (
                          <div className="font-semibold text-lg">
                            ₹{offering.startingPrice.toLocaleString()}
                            {offering.unit && <span className="text-sm text-muted-foreground">/{offering.unit}</span>}
                          </div>
                        )}
                        {offering.budgetBand && (
                          <Badge variant="outline">{offering.budgetBand}</Badge>
                        )}
                      </div>
                    </div>

                    {offering.description && (
                      <p className="text-muted-foreground">{offering.description}</p>
                    )}

                    {offering.features && offering.features.length > 0 && (
                      <div>
                        <h5 className="font-medium mb-2">Features</h5>
                        <div className="flex flex-wrap gap-2">
                          {offering.features.map((feature: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {offering.photos && offering.photos.length > 0 && (
                      <div>
                        <h5 className="font-medium mb-2">Photos ({offering.photos.length})</h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {offering.photos.map((photo: any, idx: number) => (
                            <div key={idx} className="relative group">
                              <img
                                src={photo.url}
                                alt={`${offering.title} photo ${idx + 1}`}
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
                  <p className="text-sm text-muted-foreground">Near Metro</p>
                  <p className="font-medium">{listing.nearMetro ? "Yes" : "No"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Power Backup</p>
                  <p className="font-medium">{listing.powerBackup ? "Available" : "Not available"}</p>
                </div>
              </div>

              {listing.metroNote && (
                <div>
                  <p className="text-sm text-muted-foreground">Metro Information</p>
                  <p className="font-medium">{listing.metroNote}</p>
                </div>
              )}

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Parking</p>
                  <p className="font-medium">{listing.parking || "Not available"}</p>
                </div>
                {listing.internetSpeedMbps && (
                  <div>
                    <p className="text-sm text-muted-foreground">Internet Speed</p>
                    <p className="font-medium">{listing.internetSpeedMbps} Mbps</p>
                  </div>
                )}
              </div>
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
                  {listing.amenities.map((amenity: string) => {
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
                <p className="text-sm text-muted-foreground">Status</p>
                <StatusBadge status={listing.verificationStatus} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Published</p>
                <p className="font-medium">{listing.isPublished ? "Yes - Live on site" : "No - Pending review"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">{listing.createdAt ? new Date(listing.createdAt).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">{listing.updatedAt ? new Date(listing.updatedAt).toLocaleDateString() : 'N/A'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Status Guide */}
          <Card>
            <CardHeader>
              <CardTitle>Status Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium">Pending Review</p>
                  <p className="text-muted-foreground">Your listing is being reviewed by our team</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-medium">Needs Info</p>
                  <p className="text-muted-foreground">Additional information required</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Approved</p>
                  <p className="text-muted-foreground">Your listing is live and visible</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium">Rejected</p>
                  <p className="text-muted-foreground">Listing needs significant changes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
