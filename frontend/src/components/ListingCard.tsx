import { Link } from "react-router-dom";
import { BadgeCheck, Train, Zap, Phone, MessageCircle, Eye, MapPin, Users, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShortlistButton } from "@/components/ShortlistButton";
import { Listing, budgetBandLabels, workspaceTypeLabels } from "@/types/models";
import { buildWhatsAppLink, buildCallLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

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
    <div className={cn(
      "group overflow-hidden card-hover animate-fade-in",
      isPremium 
        ? "card-premium" 
        : "rounded-xl border bg-card shadow-sm"
    )}>
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <img
          src={listing.photos[0]}
          alt={listing.displayName}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        
        {/* Premium gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        
        {/* Top Badges */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {listing.verificationStatus === "APPROVED_VERIFIED" && (
            <Badge className="glass bg-emerald-500/90 text-white shadow-lg animate-slide-in-right">
              <BadgeCheck className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          )}
          {listing.nearMetro && (
            <Badge className="glass bg-blue-500/90 text-white shadow-lg animate-slide-in-right" style={{ animationDelay: '0.1s' }}>
              <Train className="h-3 w-3 mr-1" />
              Near Metro
            </Badge>
          )}
          {listing.powerBackup && (
            <Badge className="glass bg-amber-500/90 text-white shadow-lg animate-slide-in-right" style={{ animationDelay: '0.2s' }}>
              <Zap className="h-3 w-3 mr-1" />
              Power Backup
            </Badge>
          )}
        </div>

        {/* Top Right Actions */}
        <div className="absolute right-3 top-3 flex flex-col gap-2">
          <ShortlistButton slug={listing.slug} listingName={listing.displayName} />
          <Badge
            className={cn(
              "glass shadow-lg animate-slide-in-right",
              listing.availabilityStatus === "available" && "bg-emerald-500/90 text-white",
              listing.availabilityStatus === "limited" && "bg-amber-500/90 text-white",
              listing.availabilityStatus === "waitlist" && "bg-slate-500/90 text-white"
            )}
            style={{ animationDelay: '0.3s' }}
          >
            {listing.availabilityStatus === "available" && "Available"}
            {listing.availabilityStatus === "limited" && "Limited"}
            {listing.availabilityStatus === "waitlist" && "Waitlist"}
          </Badge>
        </div>

        {/* Deal Tag */}
        {listing.dealTags.length > 0 && (
          <div className="absolute bottom-3 left-3">
            <Badge className="glass bg-primary/90 text-primary-foreground shadow-lg animate-bounce-gentle">
              {listing.dealTags[0]}
            </Badge>
          </div>
        )}

        {/* Premium Rating Badge */}
        {isPremium && (
          <div className="absolute bottom-3 right-3">
            <Badge className="glass bg-black/60 text-white shadow-lg">
              <Star className="h-3 w-3 mr-1 fill-current" />
              4.8
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
          <div className="flex items-center gap-1 text-sm text-muted-premium">
            <Users className="h-3 w-3" />
            <span>
              {listing.seatCapacityMin === listing.seatCapacityMax
                ? `${listing.seatCapacityMax} seats`
                : `${listing.seatCapacityMin}-${listing.seatCapacityMax} seats`}
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {listing.workspaceTypes.slice(0, 2).map((type) => (
              <Badge
                key={type}
                variant="outline"
                className="text-xs px-2 py-0.5 border-border/60 hover:border-primary/50 transition-colors"
              >
                {workspaceTypeLabels[type]}
              </Badge>
            ))}
            {listing.workspaceTypes.length > 2 && (
              <Badge variant="outline" className="text-xs px-2 py-0.5 border-border/60">
                +{listing.workspaceTypes.length - 2}
              </Badge>
            )}
          </div>
        </div>

        {/* Amenities/Highlights */}
        {isPremium && listing.highlights.length > 0 && (
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
              {budgetBandLabels[listing.budgetBand]}
            </p>
            <p className="text-xs text-muted-premium">per seat/month</p>
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
          >
            <a href={buildCallLink()}>
              <Phone className="h-4 w-4" />
              Call
            </a>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="px-3 btn-premium"
            asChild
          >
            <Link to={`/spaces/${listing.slug}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
