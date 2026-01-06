import { useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import {
  BadgeCheck,
  Train,
  Zap,
  Car,
  Clock,
  FileText,
  Users,
  MapPin,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Phone,
  Calendar,
  X,
  Wifi,
  Coffee,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StickyCTA } from "@/components/StickyCTA";
import { EnquiryForm } from "@/components/EnquiryForm";
import { ListingCard } from "@/components/ListingCard";
import { listings, budgetBandLabels, workspaceTypeLabels } from "@/data/listings";
import { buildWhatsAppLink, buildCallLink } from "@/lib/whatsapp";
import { transparencyLines } from "@/config/contact";
import { cn } from "@/lib/utils";

export default function SpaceDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [currentImage, setCurrentImage] = useState(0);
  const [visitDialogOpen, setVisitDialogOpen] = useState(false);

  const listing = listings.find((l) => l.slug === slug);

  if (!listing) {
    return <Navigate to="/explore" replace />;
  }

  const whatsappLink = buildWhatsAppLink({
    listingName: listing.displayName,
    locality: listing.locality,
  });

  const similarSpaces = listings
    .filter((l) => l.slug !== slug && l.localityId === listing.localityId)
    .slice(0, 3);

  const specs = [
    { icon: Users, label: "Capacity", value: `${listing.seatCapacityMin}-${listing.seatCapacityMax} seats` },
    { icon: Clock, label: "Access", value: listing.accessHours },
    { icon: Train, label: "Metro", value: listing.nearMetro ? listing.metroNote || "Near Metro" : "Not near metro" },
    { icon: Car, label: "Parking", value: listing.parking ? "Available" : "Not available" },
    { icon: Zap, label: "Power Backup", value: listing.powerBackup ? "Yes" : "No" },
    { icon: FileText, label: "GST Invoice", value: listing.gstInvoiceAvailable ? "Available" : "Not available" },
  ];

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % listing.photos.length);
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + listing.photos.length) % listing.photos.length);
  };

  return (
    <div className="pb-24 md:pb-0">
      {/* Breadcrumb */}
      <div className="border-b border-border bg-muted/30">
        <div className="container py-3">
          <div className="flex items-center gap-2 text-sm">
            <Link to="/explore" className="text-muted-foreground hover:text-primary">
              Explore
            </Link>
            <span className="text-muted-foreground">/</span>
            <Link to={`/explore?locality=${listing.localityId}`} className="text-muted-foreground hover:text-primary">
              {listing.locality}
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground font-medium truncate">{listing.displayName}</span>
          </div>
        </div>
      </div>

      <div className="container py-6 md:py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Gallery */}
            <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-muted">
              <img
                src={listing.photos[currentImage]}
                alt={`${listing.displayName} - Photo ${currentImage + 1}`}
                className="h-full w-full object-cover"
              />

              {listing.photos.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur-sm transition-colors hover:bg-background"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur-sm transition-colors hover:bg-background"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {listing.photos.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImage(idx)}
                        className={cn(
                          "h-2 w-2 rounded-full transition-colors",
                          idx === currentImage ? "bg-primary" : "bg-background/60"
                        )}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Badges */}
              <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                {listing.verificationStatus === "verified" && (
                  <span className="flex items-center gap-1 rounded-full bg-success px-3 py-1.5 text-sm font-medium text-success-foreground shadow-sm">
                    <BadgeCheck className="h-4 w-4" />
                    Verified
                  </span>
                )}
              </div>
            </div>

            {/* Title & Location */}
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">
                {listing.displayName}
              </h1>
              <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{listing.locality}, {listing.city}</span>
              </div>
              {/* Badges row */}
              <div className="mt-3 flex flex-wrap gap-2">
                {listing.nearMetro && (
                  <span className="flex items-center gap-1 rounded-full bg-call/10 px-3 py-1 text-xs font-medium text-call">
                    <Train className="h-3 w-3" />
                    Near Metro
                  </span>
                )}
                {listing.powerBackup && (
                  <span className="flex items-center gap-1 rounded-full bg-accent/20 px-3 py-1 text-xs font-medium text-accent-foreground">
                    <Zap className="h-3 w-3" />
                    Power Backup
                  </span>
                )}
                {listing.parking && (
                  <span className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                    <Car className="h-3 w-3" />
                    Parking
                  </span>
                )}
              </div>
            </div>

            {/* Overview */}
            <div className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-foreground">Overview</h2>
              <p className="text-muted-foreground leading-relaxed">{listing.overview}</p>
            </div>

            {/* Specs Grid */}
            <div className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-foreground">Specifications</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {specs.map((spec) => (
                  <div
                    key={spec.label}
                    className="flex items-start gap-3 rounded-lg border border-border p-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <spec.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{spec.label}</p>
                      <p className="font-medium text-foreground">{spec.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Space Types */}
            <div className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-foreground">Available Space Types</h2>
              <div className="flex flex-wrap gap-2">
                {listing.workspaceTypes.map((type) => (
                  <span
                    key={type}
                    className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-medium text-primary"
                  >
                    {workspaceTypeLabels[type]}
                  </span>
                ))}
              </div>
            </div>

            {/* Amenities */}
            <div className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-foreground">Amenities</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {listing.amenities.map((amenity) => (
                  <div key={amenity} className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10">
                      {amenity.toLowerCase().includes("wifi") ? (
                        <Wifi className="h-3 w-3 text-primary" />
                      ) : amenity.toLowerCase().includes("cafe") ? (
                        <Coffee className="h-3 w-3 text-primary" />
                      ) : (
                        <Shield className="h-3 w-3 text-primary" />
                      )}
                    </div>
                    <span className="text-sm text-foreground">{amenity}</span>
                  </div>
                ))}
              </div>
              {listing.meetingRoomsAddon && (
                <p className="text-sm text-muted-foreground mt-2">
                  ✓ Meeting rooms available as add-on
                </p>
              )}
            </div>

            {/* Deals */}
            {listing.dealTags.length > 0 && (
              <div className="space-y-3">
                <h2 className="font-display text-lg font-semibold text-foreground">Current Deals</h2>
                <div className="flex flex-wrap gap-2">
                  {listing.dealTags.map((deal) => (
                    <span
                      key={deal}
                      className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
                    >
                      🎉 {deal}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Transparency Lines */}
            <div className="space-y-4 rounded-xl bg-muted/50 p-6">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" />
                <p className="text-sm text-muted-foreground">{transparencyLines.addressHiding}</p>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" />
                <p className="text-sm text-muted-foreground">{transparencyLines.partnerFee}</p>
              </div>
            </div>

            {/* Similar Spaces */}
            {similarSpaces.length > 0 && (
              <div className="space-y-4">
                <h2 className="font-display text-lg font-semibold text-foreground">Similar Spaces in {listing.locality}</h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {similarSpaces.map((space) => (
                    <ListingCard key={space.slug} listing={space} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Desktop */}
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              {/* Budget Card */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <p className="text-sm text-muted-foreground">Budget Band</p>
                <p className="mt-1 font-display text-2xl font-bold text-primary">
                  {budgetBandLabels[listing.budgetBand]}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">On Enquiry</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {transparencyLines.budgetDisclaimer}
                </p>

                <div className="mt-6 space-y-3">
                  <Button variant="whatsapp" size="lg" className="w-full" asChild>
                    <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-5 w-5" />
                      WhatsApp Us
                    </a>
                  </Button>
                  <Button variant="call" size="lg" className="w-full" asChild>
                    <a href={buildCallLink()}>
                      <Phone className="h-5 w-5" />
                      Call Us
                    </a>
                  </Button>
                  <Dialog open={visitDialogOpen} onOpenChange={setVisitDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="lg" className="w-full">
                        <Calendar className="h-5 w-5" />
                        Request Site Visit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="font-display">Request a Visit</DialogTitle>
                      </DialogHeader>
                      <EnquiryForm
                        listingSlug={listing.slug}
                        listingName={listing.displayName}
                        locality={listing.localityId}
                        source="listing-detail"
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Availability */}
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Availability</span>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium",
                      listing.availabilityStatus === "available" && "bg-success/10 text-success",
                      listing.availabilityStatus === "limited" && "bg-accent/20 text-accent-foreground",
                      listing.availabilityStatus === "waitlist" && "bg-muted text-muted-foreground"
                    )}
                  >
                    {listing.availabilityStatus === "available" && "Available Now"}
                    {listing.availabilityStatus === "limited" && "Limited Availability"}
                    {listing.availabilityStatus === "waitlist" && "Waitlist Only"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky CTA */}
      <StickyCTA
        listingName={listing.displayName}
        locality={listing.locality}
        onRequestVisit={() => setVisitDialogOpen(true)}
      />

      {/* Visit Dialog for Mobile */}
      <Dialog open={visitDialogOpen} onOpenChange={setVisitDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Request a Visit</DialogTitle>
          </DialogHeader>
          <EnquiryForm
            listingSlug={listing.slug}
            listingName={listing.displayName}
            locality={listing.localityId}
            source="listing-detail"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
