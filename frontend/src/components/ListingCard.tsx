import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
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
import { trackListingCardClick } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { getAmenityIcon } from "@/lib/amenity-icons";
import { AnimatedCard } from "@/components/AnimatedCard";
import { AnimatedButton } from "@/components/AnimatedButton";
import { ScrollTriggerAnimation } from "@/components/ScrollTriggerAnimation";

interface ListingCardProps {
  listing: Listing;
  variant?: "default" | "premium";
  enableScrollAnimation?: boolean;
  animationDelay?: number;
}

export function ListingCard({ 
  listing, 
  variant = "premium", 
  enableScrollAnimation = true,
  animationDelay = 0 
}: ListingCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);
  const isHoveredRef = useRef(false);

  const whatsappLink = buildWhatsAppLink({
    listingName: listing.displayName,
    locality: listing.locality,
  });

  const isPremium = variant === "premium";

  // Get all available photos
  const allPhotos = (() => {
    const photos: string[] = [];
    
    // Premium listings have heroPhotos array with objects
    if (listing.heroPhotos && listing.heroPhotos.length > 0) {
      listing.heroPhotos.forEach(photo => {
        const photoUrl = typeof photo === 'string' ? photo : photo?.url;
        if (photoUrl) photos.push(photoUrl);
      });
    }
    // Regular listings have photos array with strings
    else if (listing.photos && listing.photos.length > 0) {
      photos.push(...listing.photos);
    }
    
    return photos;
  })();

  // Auto-scroll functionality
  useEffect(() => {
    if (allPhotos.length <= 1) return;

    const startAutoScroll = () => {
      autoScrollRef.current = setInterval(() => {
        if (!isHoveredRef.current) {
          setCurrentPhotoIndex(prev => (prev + 1) % allPhotos.length);
        }
      }, 3000); // Change photo every 3 seconds
    };

    const stopAutoScroll = () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
        autoScrollRef.current = null;
      }
    };

    startAutoScroll();

    return () => stopAutoScroll();
  }, [allPhotos.length]);

  // Handle mouse events for pausing auto-scroll
  const handleMouseEnter = () => {
    isHoveredRef.current = true;
  };

  const handleMouseLeave = () => {
    isHoveredRef.current = false;
  };

  // Handle click to scroll to top
  const handleCardClick = () => {
    // Track listing card click
    trackListingCardClick(listing.slug, 0, {
      locality: listing.locality,
      city: listing.city
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Animation configuration for scroll-triggered reveal
  const scrollAnimation = {
    opacity: 1,
    y: 0,
    scale: 1,
    duration: 0.6,
    ease: "power2.out",
  };

  const cardContent = (
    <AnimatedCard
      elevateOnHover={true}
      tiltOnHover={false}
      glowOnHover={false}
      intensity="normal"
      clickable={true}
      className={cn(
        "group overflow-hidden block h-full",
        isPremium 
          ? "card-premium" 
          : "rounded-xl border bg-card shadow-sm"
      )} 
    >
      {/* Image with Auto-Scrolling Carousel */}
      <div 
        className="relative aspect-[16/10] overflow-hidden bg-muted"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {allPhotos.length > 0 ? (
          <>
            <img
              src={allPhotos[currentPhotoIndex]}
              alt={`${listing.displayName} - Photo ${currentPhotoIndex + 1}`}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              loading="lazy"
            />
            
            {/* Photo indicators - only show if multiple photos */}
            {allPhotos.length > 1 && (
              <div className="absolute bottom-2 right-2 flex gap-1">
                {allPhotos.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "h-1.5 w-1.5 rounded-full transition-all duration-300",
                      index === currentPhotoIndex 
                        ? "bg-white scale-125" 
                        : "bg-white/60"
                    )}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="h-full w-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground text-sm">No image</span>
          </div>
        )}
        
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
      <div className={cn("p-4 space-y-3", isPremium && "p-5 space-y-4")}>
        {/* Title & Location */}
        <div>
          <h3 className={cn(
            "font-display font-semibold text-foreground line-clamp-2 leading-tight transition-colors group-hover:text-primary",
            isPremium ? "text-lg mb-1" : "text-base mb-0.5"
          )}>
            {listing.displayName}
          </h3>
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <p className="text-sm text-muted-premium truncate">
              {listing.locality}, {listing.city}
            </p>
          </div>
        </div>

        {/* Capacity & Workspace Types - Compact Row */}
        <div className="flex items-center justify-between gap-2">
          {(listing.seatCapacityMin || listing.seatCapacityMax) && (
            <div className="flex items-center gap-1 text-sm text-muted-premium flex-shrink-0">
              <Users className="h-3 w-3" />
              <span className="font-medium">
                {listing.seatCapacityMin === listing.seatCapacityMax
                  ? `${listing.seatCapacityMax}`
                  : `${listing.seatCapacityMin || 0}-${listing.seatCapacityMax || 0}`}
              </span>
            </div>
          )}
          <div className="flex flex-wrap gap-1 justify-end">
            {listing.workspaceTypes && listing.workspaceTypes.slice(0, 2).map((type) => (
              <Badge
                key={type}
                variant="outline"
                className="text-xs px-1.5 py-0.5 border-border/60 hover:border-primary/50 transition-colors"
              >
                {(workspaceTypeLabels[type] || '').split(' ')[0]} {/* Show first word only */}
              </Badge>
            ))}
            {listing.workspaceTypes && listing.workspaceTypes.length > 2 && (
              <Badge variant="outline" className="text-xs px-1.5 py-0.5 border-border/60">
                +{listing.workspaceTypes.length - 2}
              </Badge>
            )}
          </div>
        </div>

        {/* Amenities with Icons - More Compact */}
        {listing.amenities && listing.amenities.length > 0 && (
          <div>
            <div className="flex flex-wrap gap-1">
              {listing.amenities.slice(0, 6).map((amenity) => {
                const IconComponent = getAmenityIcon(amenity);
                return (
                  <div
                    key={amenity}
                    className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/30 rounded px-1.5 py-0.5 hover:bg-muted/50 transition-colors"
                    title={amenity}
                  >
                    <IconComponent className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate max-w-[60px]">{(amenity || '').split(' ')[0]}</span>
                  </div>
                );
              })}
              {listing.amenities.length > 6 && (
                <div className="flex items-center text-xs text-muted-foreground bg-muted/30 rounded px-1.5 py-0.5">
                  +{listing.amenities.length - 6}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Premium Highlights (fallback if no amenities) */}
        {isPremium && (!listing.amenities || listing.amenities.length === 0) && listing.highlights && listing.highlights.length > 0 && (
          <div>
            <div className="flex flex-wrap gap-1">
              {listing.highlights.slice(0, 4).map((highlight) => (
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

        {/* Pricing & CTAs Combined Row */}
        <div className="flex items-end justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className={cn(
              "font-display font-bold text-primary leading-none",
              isPremium ? "text-base" : "text-sm"
            )}>
              {listing.budgetBand ? budgetBandLabels[listing.budgetBand] : "On Enquiry"}
            </p>
            <p className="text-xs text-muted-premium mt-0.5 truncate">
              Final pricing on enquiry
            </p>
          </div>
          
          {/* Compact CTAs */}
          <div className="flex gap-1.5 flex-shrink-0">
            <AnimatedButton 
              variant="whatsapp" 
              size="sm" 
              className="px-3 py-1.5 btn-premium text-xs" 
              intensity="subtle"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open(whatsappLink, '_blank', 'noopener,noreferrer');
              }}
            >
              <MessageCircle className="h-3 w-3" />
              <span className="hidden sm:inline ml-1">WhatsApp</span>
            </AnimatedButton>
            <AnimatedButton 
              variant="call" 
              size="sm" 
              className="px-3 py-1.5 btn-premium text-xs" 
              intensity="subtle"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open(buildCallLink(), '_self');
              }}
            >
              <Phone className="h-3 w-3" />
              <span className="hidden sm:inline ml-1">Call</span>
            </AnimatedButton>
          </div>
        </div>
      </div>
    </AnimatedCard>
  );

  // Wrap with Link for navigation
  const linkedCard = (
    <Link 
      to={`/spaces/${listing.slug.replace('/listing/', '')}`}
      className="block h-full"
      onClick={handleCardClick}
    >
      {cardContent}
    </Link>
  );

  // Conditionally wrap with scroll animation
  if (enableScrollAnimation) {
    return (
      <ScrollTriggerAnimation
        animation={scrollAnimation}
        start="top 85%"
        end="bottom 15%"
        className="h-full"
      >
        {linkedCard}
      </ScrollTriggerAnimation>
    );
  }

  return linkedCard;
}
