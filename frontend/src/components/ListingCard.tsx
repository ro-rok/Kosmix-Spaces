import { Link } from "react-router-dom";
import { BadgeCheck, Train, Zap, Phone, MessageCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShortlistButton } from "@/components/ShortlistButton";
import { Listing, budgetBandLabels, workspaceTypeLabels } from "@/data/listings";
import { buildWhatsAppLink, buildCallLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const whatsappLink = buildWhatsAppLink({
    listingName: listing.displayName,
    locality: listing.locality,
  });

  return (
    <div className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/30">
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <img
          src={listing.photos[0]}
          alt={listing.displayName}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {listing.verificationStatus === "verified" && (
            <span className="flex items-center gap-1 rounded-full bg-success px-2.5 py-1 text-xs font-medium text-success-foreground shadow-sm">
              <BadgeCheck className="h-3 w-3" />
              Verified
            </span>
          )}
          {listing.nearMetro && (
            <span className="flex items-center gap-1 rounded-full bg-call px-2.5 py-1 text-xs font-medium text-call-foreground shadow-sm">
              <Train className="h-3 w-3" />
              Near Metro
            </span>
          )}
          {listing.powerBackup && (
            <span className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground shadow-sm">
              <Zap className="h-3 w-3" />
              Power Backup
            </span>
          )}
        </div>

        {/* Save Button */}
        <div className="absolute right-3 top-3 flex flex-col gap-2">
          <ShortlistButton slug={listing.slug} listingName={listing.displayName} />
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium shadow-sm",
              listing.availabilityStatus === "available" && "bg-success/90 text-success-foreground",
              listing.availabilityStatus === "limited" && "bg-accent/90 text-accent-foreground",
              listing.availabilityStatus === "waitlist" && "bg-muted text-muted-foreground"
            )}
          >
            {listing.availabilityStatus === "available" && "Available"}
            {listing.availabilityStatus === "limited" && "Limited"}
            {listing.availabilityStatus === "waitlist" && "Waitlist"}
          </span>
        </div>

        {/* Deal Tag */}
        {listing.dealTags.length > 0 && (
          <div className="absolute bottom-3 left-3">
            <span className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground shadow">
              {listing.dealTags[0]}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title & Location */}
        <h3 className="font-display text-lg font-semibold text-foreground line-clamp-1">
          {listing.displayName}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {listing.locality}, {listing.city}
        </p>

        {/* Highlights */}
        <div className="mt-3 flex flex-wrap gap-2">
          {listing.highlights.slice(0, 3).map((highlight) => (
            <span
              key={highlight}
              className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
            >
              {highlight}
            </span>
          ))}
        </div>

        {/* Budget */}
        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="font-display text-lg font-bold text-primary">
              {budgetBandLabels[listing.budgetBand]}
            </p>
            <p className="text-xs text-muted-foreground">On Enquiry</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">
              {listing.seatCapacityMin === listing.seatCapacityMax
                ? `${listing.seatCapacityMax} seats`
                : `${listing.seatCapacityMin}-${listing.seatCapacityMax} seats`}
            </p>
          </div>
        </div>

        {/* Space Types */}
        <div className="mt-3 flex flex-wrap gap-1">
          {listing.workspaceTypes.map((type) => (
            <span
              key={type}
              className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground"
            >
              {workspaceTypeLabels[type]}
            </span>
          ))}
        </div>

        {/* CTAs */}
        <div className="mt-4 flex gap-2">
          <Button variant="whatsapp" size="sm" className="flex-1" asChild>
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
          </Button>
          <Button variant="call" size="sm" className="flex-1" asChild>
            <a href={buildCallLink()}>
              <Phone className="h-4 w-4" />
              Call
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/spaces/${listing.slug}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
