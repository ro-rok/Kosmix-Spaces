import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Eye, Send, AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ListingBuilder } from "@/components/ListingBuilder";
import { AdminNotesPanel } from "@/components/AdminNotesPanel";
import { usePartnerListing } from "@/hooks/useAuth";
import { VerificationStatus } from "@/types/models";
import { cn } from "@/lib/utils";

export function PartnerListingDetail() {
  const { listingId } = useParams<{ listingId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEdit = searchParams.get('edit') === 'true';

  const { data: listing, isLoading, error } = usePartnerListing(listingId || '');

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
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/partner/listings')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Listing Not Found</h1>
            <p className="text-muted-foreground">The requested listing could not be found</p>
          </div>
        </div>
      </div>
    );
  }

  // If in edit mode, show the listing builder
  if (isEdit) {
    return <ListingBuilder listingId={listingId} isEdit={true} />;
  }

  // Otherwise show the listing details view
  const getStatusConfig = (status: VerificationStatus) => {
    const configs = {
      'PENDING_REVIEW': {
        label: 'Pending Review',
        description: 'Your listing is being reviewed by our team',
        variant: 'secondary' as const,
        icon: Clock,
        color: 'text-yellow-600'
      },
      'NEEDS_INFO': {
        label: 'Needs Information',
        description: 'Additional information required before approval',
        variant: 'destructive' as const,
        icon: AlertCircle,
        color: 'text-red-600'
      },
      'APPROVED_VERIFIED': {
        label: 'Approved & Verified',
        description: 'Your listing is live and visible to customers',
        variant: 'default' as const,
        icon: CheckCircle,
        color: 'text-green-600'
      },
      'REJECTED': {
        label: 'Rejected',
        description: 'Your listing was rejected and needs significant changes',
        variant: 'destructive' as const,
        icon: XCircle,
        color: 'text-red-600'
      }
    };

    return configs[status] || configs['PENDING_REVIEW'];
  };

  const statusConfig = getStatusConfig(listing.verificationStatus as VerificationStatus);
  const StatusIcon = statusConfig.icon;

  const canEdit = listing.verificationStatus === 'NEEDS_INFO' || 
                  listing.verificationStatus === 'PENDING_REVIEW' ||
                  listing.verificationStatus === 'REJECTED' ||
                  listing.status === 'pending';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/partner/listings')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl font-bold text-foreground">
                {listing.displayName}
              </h1>
              <Badge variant={statusConfig.variant} className="flex items-center gap-1">
                <StatusIcon className="h-3 w-3" />
                {statusConfig.label}
              </Badge>
            </div>
            <p className="text-muted-foreground">{listing.locality}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href={`/listing/${listing.slug}`} target="_blank" rel="noopener noreferrer">
              <Eye className="h-4 w-4" />
              Preview
            </a>
          </Button>
          
          {canEdit && (
            <Button onClick={() => navigate(`/partner/listings/${listingId}?edit=true`)}>
              <Edit className="h-4 w-4" />
              {listing.verificationStatus === 'NEEDS_INFO' ? 'Edit & Resubmit' : 'Edit'}
            </Button>
          )}
        </div>
      </div>

      {/* Status Card */}
      <Card className={cn(
        "border-2",
        statusConfig.variant === 'default' && "border-green-200 bg-green-50",
        statusConfig.variant === 'secondary' && "border-yellow-200 bg-yellow-50",
        statusConfig.variant === 'destructive' && "border-red-200 bg-red-50"
      )}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <StatusIcon className={cn("h-6 w-6", statusConfig.color)} />
            <div>
              <CardTitle className={statusConfig.color}>{statusConfig.label}</CardTitle>
              <p className={cn("text-sm", statusConfig.color.replace('600', '700'))}>
                {statusConfig.description}
              </p>
            </div>
          </div>
        </CardHeader>
        
        {listing.verificationStatus === 'NEEDS_INFO' && (
          <CardContent>
            <AdminNotesPanel listing={listing} />
          </CardContent>
        )}
      </Card>

      {/* Listing Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Display Name</p>
              <p className="font-medium">{listing.displayName}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Location</p>
              <p className="font-medium">{listing.locality}, {listing.city || 'Delhi'}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Overview</p>
              <p className="text-sm">{listing.overview}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Workspace Types</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {listing.workspaceTypes?.map((type) => (
                  <Badge key={type} variant="outline">{type}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status & Dates */}
        <Card>
          <CardHeader>
            <CardTitle>Status & Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Listing Status</p>
              <p className="font-medium">{listing.status}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Verification Status</p>
              <p className="font-medium">{listing.verificationStatus}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">
                {new Date(listing.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="font-medium">
                {new Date(listing.updatedAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Amenities */}
      {listing.amenities && listing.amenities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Amenities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {listing.amenities.map((amenity) => (
                <Badge key={amenity} variant="secondary">{amenity}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photos */}
      {listing.photos && listing.photos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Photos ({listing.photos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {listing.photos.map((photo, index) => (
                <div key={index} className="relative">
                  <img
                    src={typeof photo === 'string' ? photo : photo.url}
                    alt={`${listing.displayName} ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  <Badge className="absolute bottom-2 left-2" variant="secondary">
                    {index + 1}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      {listing.verificationStatus !== 'APPROVED_VERIFIED' && (
        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            {listing.verificationStatus === 'PENDING_REVIEW' && (
              <div className="space-y-2">
                <p className="text-sm">
                  Your listing is currently being reviewed by our team. This typically takes 1-2 business days.
                </p>
                <p className="text-sm text-muted-foreground">
                  We'll notify you once the review is complete. You can make edits while the review is in progress.
                </p>
              </div>
            )}
            
            {listing.verificationStatus === 'NEEDS_INFO' && (
              <div className="space-y-3">
                <p className="text-sm">
                  Our team has requested additional information. Please review the feedback above and make the necessary changes.
                </p>
                <Button onClick={() => navigate(`/partner/listings/${listingId}?edit=true`)}>
                  <Edit className="h-4 w-4" />
                  Edit & Resubmit
                </Button>
              </div>
            )}
            
            {listing.verificationStatus === 'REJECTED' && (
              <div className="space-y-3">
                <p className="text-sm">
                  Your listing was rejected. Please review the feedback and make significant improvements before resubmitting.
                </p>
                <Button onClick={() => navigate(`/partner/listings/${listingId}?edit=true`)}>
                  <Edit className="h-4 w-4" />
                  Edit & Resubmit
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}