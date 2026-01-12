import { Link } from "react-router-dom";
import { 
  BadgeCheck, 
  Phone, 
  MessageCircle, 
  MapPin, 
  Users, 
  Star,
  Wifi,
  Coffee,
  Car,
  Dumbbell,
  Shield,
  Zap,
  Users2,
  Building,
  Utensils,
  Printer,
  Camera,
  Headphones,
  TreePine,
  Briefcase,
  Clock,
  Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Listing, budgetBandLabels, workspaceTypeLabels } from "@/types/models";
import { buildWhatsAppLink, buildCallLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { getAmenityIcon } from "@/lib/amenity-icons";

interface ListingCardProps {
  listing: Listing;
  variant?: "default" | "premium";
}

export function ListingCard({ listing, variant = "premium" }: ListingCardProps) {
  const whatsappLink = buildWhatsAppLink({
    listingName: listing.displayName,
    locality: listing.locality,
  });

  const isPremium = variant === "premium";

  return (
    <Link 
      to={`/spaces/${listing.slug.replace('/listing/', '')}`}
      className={cn(
        "group overflow-hidden card-hover animate-fade-in block",
        isPremium 
          ? "card-premium" 
          : "rounded-xl border bg-card shadow-sm"
      )}
    >
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {/* Get the first photo URL - handle both regular and premium listing structures */}
        {(() => {
          let photoUrl = "";
          
          // Premium listings have heroPhotos array with objects
          if (listing.heroPhotos && listing.heroPhotos.length > 0) {
            const firstPhoto = listing.heroPhotos[0];
            photoUrl = typeof firstPhoto === 'string' ? firstPhoto : firstPhoto?.url;
          }
          // Regular listings have photos array with strings
          else if (listing.photos && listing.photos.length > 0) {
            photoUrl = listing.photos[0];
          }
          
          return photoUrl ? (
            <img
              src={photoUrl}
              alt={listing.displayName}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full bg-muted flex items-center justify-center">
              <span className="text-muted-foreground text-sm">No image</span>
            </div>
          );
        })()}
        
        {/* Premium gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        
        {/* Top Badges - Only Verified */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {listing.verificationStatus === "APPROVED_VERIFIED" && (
            <Badge className="glass !bg-emerald-500/90 !text-white shadow-lg animate-slide-in-right !hover:bg-emerald-500/90">
              <BadgeCheck className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          )}
        </div>

        {/* Top Right Actions */}
        <div className="absolute right-3 top-3 flex flex-col gap-2">
          {listing.availabilityStatus && (
            <Badge
              className={cn(
                "glass shadow-lg animate-slide-in-right",
                listing.availabilityStatus === "available" && "!bg-emerald-500/90 !text-white !hover:bg-emerald-500/90",
                listing.availabilityStatus === "unavailable" && "!bg-red-500/90 !text-white !hover:bg-red-500/90",
                listing.availabilityStatus === "limited" && "!bg-amber-500/90 !text-white !hover:bg-amber-500/90",
                listing.availabilityStatus === "waitlist" && "!bg-slate-500/90 !text-white !hover:bg-slate-500/90"
              )}
              style={{ animationDelay: '0.3s' }}
            >
              {listing.availabilityStatus === "available" && "Available"}
              {listing.availabilityStatus === "unavailable" && "Unavailable"}
              {listing.availabilityStatus === "limited" && "Limited"}
              {listing.availabilityStatus === "waitlist" && "Waitlist"}
            </Badge>
          )}
        </div>

        {/* Deal Tag */}
        {listing.dealTags && listing.dealTags.length > 0 && (
          <div className="absolute bottom-3 left-3">
            <Badge className="glass bg-primary/90 text-primary-foreground shadow-lg animate-bounce-gentle">
              {listing.dealTags[0]}
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={cn("p-4", isPremium && "p-5")}>
        {/* Title & Location */}
        <div className="mb-3">
          <h3 className={cn(
            "font-display font-semibold text-foreground line-clamp-1 transition-colors group-hover:text-primary",
            isPremium ? "text-lg" : "text-base"
          )}>
            {listing.displayName}
          </h3>
          <div className="flex items-center gap-1 mt-1">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <p className="text-sm text-muted-premium">
              {listing.locality}, {listing.city}
            </p>
          </div>
        </div>

        {/* Capacity & Workspace Types */}
        <div className="flex items-center justify-between mb-3">
          {(listing.seatCapacityMin || listing.seatCapacityMax) && (
            <div className="flex items-center gap-1 text-sm text-muted-premium">
              <Users className="h-3 w-3" />
              <span>
                {listing.seatCapacityMin === listing.seatCapacityMax
                  ? `${listing.seatCapacityMax} seats`
                  : `${listing.seatCapacityMin || 0}-${listing.seatCapacityMax || 0} seats`}
              </span>
            </div>
          )}
          <div className="flex flex-wrap gap-1">
            {listing.workspaceTypes && listing.workspaceTypes.slice(0, 2).map((type) => (
              <Badge
                key={type}
                variant="outline"
                className="text-xs px-2 py-0.5 border-border/60 hover:border-primary/50 transition-colors"
              >
                {workspaceTypeLabels[type]}
              </Badge>
            ))}
            {listing.workspaceTypes && listing.workspaceTypes.length > 2 && (
              <Badge variant="outline" className="text-xs px-2 py-0.5 border-border/60">
                +{listing.workspaceTypes.length - 2}
              </Badge>
            )}
          </div>
        </div>

        {/* Amenities with Icons */}
        {listing.amenities && listing.amenities.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {listing.amenities.slice(0, 4).map((amenity) => {
                const IconComponent = getAmenityIcon(amenity);
                return (
                  <Badge
                    key={amenity}
                    variant="secondary"
                    className="text-xs px-2 py-1 bg-muted/50 hover:bg-muted transition-colors flex items-center gap-1"
                  >
                    <IconComponent className="h-3 w-3" />
                    {amenity}
                  </Badge>
                );
              })}
              {listing.amenities.length > 4 && (
                <Badge 
                  variant="secondary" 
                  className="text-xs px-2 py-1 bg-muted/50 hover:bg-muted transition-colors"
                >
                  +{listing.amenities.length - 4} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Premium Highlights (fallback if no amenities) */}
        {isPremium && (!listing.amenities || listing.amenities.length === 0) && listing.highlights && listing.highlights.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {listing.highlights.slice(0, 3).map((highlight) => (
                <Badge
                  key={highlight}
                  variant="secondary"
                  className="text-xs px-2 py-0.5 bg-muted/50 hover:bg-muted transition-colors"
                >
                  {highlight}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Pricing */}
        <div className="mb-4">
          <div className="flex items-baseline gap-2">
            <p className={cn(
              "font-display font-bold text-primary",
              isPremium ? "text-lg" : "text-base"
            )}>
              {listing.budgetBand ? budgetBandLabels[listing.budgetBand] : "On Enquiry"}
            </p>
          </div>
          <p className="text-xs text-muted-premium mt-0.5">
            Final pricing on enquiry
          </p>
        </div>

        {/* CTAs */}
        <div className="flex gap-2">
          <Button 
            variant="whatsapp" 
            size="sm" 
            className="flex-1 btn-premium" 
            asChild
            onClick={(e) => e.stopPropagation()}
          >
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
          </Button>
          <Button 
            variant="call" 
            size="sm" 
            className="flex-1 btn-premium" 
            asChild
            onClick={(e) => e.stopPropagation()}
          >
            <a href={buildCallLink()}>
              <Phone className="h-4 w-4" />
              Call
            </a>
          </Button>
        </div>
      </div>
    </Link>
  );
}
