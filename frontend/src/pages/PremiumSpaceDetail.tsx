import { useState, useEffect, useRef } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import {
  BadgeCheck,
  MapPin,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Phone,
  Calendar,
  Shield,
  Clock,
  Users,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import { getAmenityIcon } from "@/lib/amenity-icons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { EnquiryForm } from "@/components/EnquiryForm";
import { VisitRequestForm } from "@/components/VisitRequestForm";
import { useListingDetail } from "@/hooks/useApi";
import { buildWhatsAppLink, buildCallLink } from "@/lib/whatsapp";
import { formatPrice } from "@/lib/price";
import { offeringTypeLabels, OfferingType } from "@/types/models";
import { transparencyLines } from "@/config/contact";
import { cn } from "@/lib/utils";
import { trackListingView, trackWhatsAppClick, trackCallClick, trackEnquirySubmit } from "@/lib/analytics";

// Navigation tabs for scroll-spy
const navigationTabs = [
  { id: "overview", label: "OVERVIEW" },
  { id: "offerings", label: "OFFERINGS & PRICING" },
  { id: "location", label: "LOCATION" },
  { id: "amenities", label: "AMENITIES" },
];

// Trust indicators
const trustIndicators = [
  { icon: BadgeCheck, text: "Verified listing" },
  { icon: Clock, text: "Response within 24 hours" },
  { icon: Shield, text: "No customer fees" },
];

export default function PremiumSpaceDetail() {
  const { "*": slugPath } = useParams<{ "*": string }>();
  const slug = slugPath || ""; // Use slug as-is without leading slash
  const [currentImage, setCurrentImage] = useState(0);
  const [visitDialogOpen, setVisitDialogOpen] = useState(false);
  const [enquiryDialogOpen, setEnquiryDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedOffering, setExpandedOffering] = useState<OfferingType | null>(null);
  
  // Refs for scroll-spy
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const observerRef = useRef<IntersectionObserver | null>(null);

  const { data: listing, isLoading, error } = useListingDetail(slug);

  // Track listing view when listing data is loaded
  useEffect(() => {
    if (listing && slug) {
      trackListingView(listing.slug, slug, {
        verificationStatus: listing.verificationStatus,
        locality: listing.locality,
        city: listing.city
      });
    }
  }, [listing, slug]);

  // Set up scroll-spy intersection observer
  useEffect(() => {
    if (!listing) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveTab(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-20% 0px -70% 0px",
        threshold: 0.1,
      }
    );

    // Observe all sections
    navigationTabs.forEach(({ id }) => {
      const element = sectionRefs.current[id];
      if (element) {
        observerRef.current?.observe(element);
      }
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [listing]);

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return <Navigate to="/explore" replace />;
  }

  const whatsappLink = buildWhatsAppLink({
    listingName: listing.displayName,
    locality: listing.locality,
  });

  // Analytics tracking handlers
  const handleWhatsAppClick = () => {
    trackWhatsAppClick(listing.slug, {
      locality: listing.locality,
      verificationStatus: listing.verificationStatus
    });
  };

  const handleCallClick = () => {
    trackCallClick(listing.slug, {
      locality: listing.locality,
      verificationStatus: listing.verificationStatus
    });
  };

  const handleEnquirySubmit = () => {
    trackEnquirySubmit(listing.slug, 'form', {
      locality: listing.locality,
      verificationStatus: listing.verificationStatus
    });
  };

  // Handle loading and error states
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Listing not found</h1>
          <p className="text-muted-foreground">The listing you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  // Get all photos for the image carousel (hero photos + offering photos)
  const allPhotos = [
    ...(listing.heroPhotos || []),
    ...Object.values(listing.offerings || {}).flatMap((offering: any) => offering.photos || [])
  ];

  // Ensure currentImage is within bounds
  const safeCurrentImage = Math.min(currentImage, Math.max(0, allPhotos.length - 1));

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % allPhotos.length);
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + allPhotos.length) % allPhotos.length);
  };

  const scrollToSection = (sectionId: string) => {
    const element = sectionRefs.current[sectionId];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Get enabled offerings from the listing data
  const enabledOfferings = Object.values(listing.offerings || {}).filter((offering: any) => offering.enabled);

  return (
    <div className="pb-24 md:pb-0">
      {/* Breadcrumb */}
      <div className="border-b border-border bg-muted/30">
        <div className="container py-3">
          <div className="flex items-center gap-2 text-sm">
            <Link to="/explore" className="text-muted-foreground hover:text-primary transition-colors">
              Explore
            </Link>
            <span className="text-muted-foreground">/</span>
            <Link 
              to={`/explore?locality=${listing.localityId}`} 
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              {listing.locality}
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground font-medium truncate">{listing.displayName}</span>
          </div>
        </div>
      </div>

      <div className="container py-6 md:py-8">
        {/* Desktop 2-column layout: 68% content, 32% sticky enquiry card */}
        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          {/* Main Content - 68% */}
          <div className="space-y-8">
            {/* Hero Gallery */}
            <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-muted">
              {allPhotos.length > 0 ? (
                <img
                  src={allPhotos[safeCurrentImage]?.url}
                  alt={`${listing.displayName} - Photo ${safeCurrentImage + 1}`}
                  className="h-full w-full object-cover transition-transform duration-300"
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-muted">
                  <p className="text-muted-foreground">No photos available</p>
                </div>
              )}

              {allPhotos.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-background/90 text-foreground backdrop-blur-sm transition-all hover:bg-background hover:scale-105 shadow-lg"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-background/90 text-foreground backdrop-blur-sm transition-all hover:bg-background hover:scale-105 shadow-lg"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {allPhotos.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImage(idx)}
                        className={cn(
                          "h-3 w-3 rounded-full transition-all duration-200",
                          idx === safeCurrentImage 
                            ? "bg-primary scale-110" 
                            : "bg-background/60 hover:bg-background/80"
                        )}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Verification Badge */}
              {(listing.verificationStatus === "APPROVED_VERIFIED") && (
                <div className="absolute left-4 top-4">
                  <Badge className="!bg-success !text-success-foreground shadow-lg !hover:bg-success">
                    <BadgeCheck className="h-4 w-4 mr-1" />
                    Verified
                  </Badge>
                </div>
              )}
            </div>

            {/* Title & Location */}
            <div className="space-y-4">
              <div>
                <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground leading-tight">
                  {listing.displayName}, {listing.locality}
                </h1>
                <p className="mt-2 text-lg text-muted-foreground">
                  {listing.locality}, {listing.city}
                </p>
              </div>

              {/* Trust Indicators Row */}
              <div className="flex flex-wrap gap-6">
                {trustIndicators.map((indicator, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <indicator.icon className="h-5 w-5 text-success" />
                    <span className="text-sm font-medium text-foreground">{indicator.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Tabs with Scroll-spy */}
            <div className="sticky top-20 z-40 bg-background/95 backdrop-blur-sm border-b border-border -mx-4 px-4 md:mx-0 md:px-0">
              <div className="flex gap-8 overflow-x-auto scrollbar-hide">
                {navigationTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => scrollToSection(tab.id)}
                    className={cn(
                      "py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                      activeTab === tab.id
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Overview Section */}
            <section
              id="overview"
              ref={(el) => (sectionRefs.current.overview = el)}
              className="space-y-6"
            >
              <div>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">Overview</h2>
                <p className="text-muted-foreground leading-relaxed text-lg">{listing.overview}</p>
              </div>

              {/* Key Specs */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Card className="border-border/50 hover:border-border transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Capacity</p>
                        <p className="font-semibold text-foreground">
                          {listing.seatCapacityMin}-{listing.seatCapacityMax} seats
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50 hover:border-border transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Access Hours</p>
                        <p className="font-semibold text-foreground">{listing.accessHours}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50 hover:border-border transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-semibold text-foreground">
                          {listing.nearMetro ? "Near Metro" : "City Center"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Offerings & Pricing Section */}
            <section
              id="offerings"
              ref={(el) => (sectionRefs.current.offerings = el)}
              className="space-y-6"
            >
              <h2 className="font-display text-2xl font-semibold text-foreground">Offerings & Pricing</h2>
              
              <div className="space-y-4">
                {enabledOfferings.length > 0 ? (
                  enabledOfferings.map((offering: any) => (
                    <Card key={offering.type} className="border-border/50 hover:border-border transition-all duration-200">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {/* Offering Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                                {offering.title}
                              </h3>
                              <p className="text-muted-foreground mb-3">{offering.description}</p>
                              
                              {/* Pricing */}
                              <div className="text-lg font-semibold text-primary">
                                {formatPrice({
                                startingPrice: offering.startingPrice,
                                unit: offering.unit,
                                budgetBand: offering.budgetBand,
                              })}
                            </div>
                          </div>

                          {/* Expand/Collapse Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedOffering(
                              expandedOffering === offering.type ? null : offering.type
                            )}
                            className="ml-4"
                          >
                            {expandedOffering === offering.type ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </div>

                        {/* Expandable Features */}
                        {expandedOffering === offering.type && (
                          <div className="space-y-4 pt-4 border-t border-border/50">
                            {/* Features List */}
                            <div>
                              <h4 className="font-medium text-foreground mb-2">Features Included</h4>
                              <div className="grid gap-2 sm:grid-cols-2">
                                {offering.features.map((feature, index) => (
                                  <div key={index} className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                    <span className="text-sm text-muted-foreground">{feature}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Photo Gallery */}
                            {offering.photos.length > 0 && (
                              <div>
                                <h4 className="font-medium text-foreground mb-2">Gallery</h4>
                                <div className="grid gap-2 sm:grid-cols-3">
                                  {offering.photos.map((photo, index) => (
                                    <div key={index} className="aspect-[4/3] overflow-hidden rounded-lg">
                                      <img
                                        src={photo.url}
                                        alt={`${offering.title} - Photo ${index + 1}`}
                                        className="h-full w-full object-cover hover:scale-105 transition-transform duration-200"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
                ) : (
                  <Card className="border-border/50">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <p className="text-muted-foreground">No offerings are currently available for this listing.</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </section>

            {/* Location Section */}
            <section
              id="location"
              ref={(el) => (sectionRefs.current.location = el)}
              className="space-y-6"
            >
              <h2 className="font-display text-2xl font-semibold text-foreground">Location</h2>
              
              <Card className="border-border/50">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">{listing.locality}, {listing.city}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Exact location shared after enquiry
                        </p>
                      </div>
                    </div>
                    
                    {/* Approximate Map Placeholder */}
                    <div className="aspect-[16/9] bg-muted rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Approximate location</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Exact address shared after enquiry
                        </p>
                      </div>
                    </div>

                    {/* Location Features */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      {listing.nearMetro && (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-primary/10 text-primary">
                            Near Metro
                          </Badge>
                          {listing.metroNote && (
                            <span className="text-sm text-muted-foreground">{listing.metroNote}</span>
                          )}
                        </div>
                      )}
                      {listing.parking && (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-muted">
                            Parking Available
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Amenities Section */}
            <section
              id="amenities"
              ref={(el) => (sectionRefs.current.amenities = el)}
              className="space-y-6"
            >
              <h2 className="font-display text-2xl font-semibold text-foreground">Amenities</h2>
              
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {listing.amenities.map((amenity, index) => {
                  const IconComponent = getAmenityIcon(amenity);
                  return (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg border border-border/50">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <IconComponent className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-foreground">{amenity}</span>
                    </div>
                  );
                })}
              </div>

              {listing.meetingRoomsAddon && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary text-primary-foreground">Add-on</Badge>
                      <span className="text-sm font-medium text-foreground">
                        Meeting rooms available as add-on
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </section>

            {/* Privacy Notice */}
            <Card className="border-muted bg-muted/30">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <p className="text-sm text-muted-foreground">{transparencyLines.addressHiding}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <p className="text-sm text-muted-foreground">{transparencyLines.partnerFee}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sticky Enquiry Card - Desktop (32%) */}
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              <Card className="border-border shadow-lg">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Starting from</p>
                      <p className="font-display text-2xl font-bold text-primary">
                        {enabledOfferings.length > 0 ? formatPrice({
                          startingPrice: (enabledOfferings[0] as any)?.startingPrice,
                          unit: (enabledOfferings[0] as any)?.unit,
                          budgetBand: (enabledOfferings[0] as any)?.budgetBand,
                        }) : "Contact for pricing"}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {transparencyLines.budgetDisclaimer}
                      </p>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <Button variant="whatsapp" size="lg" className="w-full" asChild>
                        <a 
                          href={whatsappLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={handleWhatsAppClick}
                        >
                          <MessageCircle className="h-5 w-5" />
                          WhatsApp Us
                        </a>
                      </Button>
                      
                      <Button variant="call" size="lg" className="w-full" asChild>
                        <a href={buildCallLink()} onClick={handleCallClick}>
                          <Phone className="h-5 w-5" />
                          Call Us
                        </a>
                      </Button>

                      <Button 
                        variant="default" 
                        size="lg" 
                        className="w-full"
                        onClick={() => {
                          handleEnquirySubmit();
                          setEnquiryDialogOpen(true);
                        }}
                      >
                        Enquire Now
                      </Button>
                      
                      <Dialog open={visitDialogOpen} onOpenChange={setVisitDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="lg" className="w-full">
                            <Calendar className="h-5 w-5" />
                            Schedule a Visit
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="font-display">Schedule a Visit</DialogTitle>
                          </DialogHeader>
                          <VisitRequestForm
                            listingSlug={listing.slug}
                            listingName={listing.displayName}
                            locality={listing.locality}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Availability Status */}
              <Card className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Availability</span>
                    <Badge
                      variant={listing.availabilityStatus === "available" ? "default" : "secondary"}
                      className={cn(
                        listing.availabilityStatus === "available" && "!bg-success !text-success-foreground !hover:bg-success",
                        listing.availabilityStatus === "limited" && "!bg-accent !text-accent-foreground !hover:bg-accent",
                        listing.availabilityStatus === "waitlist" && "!bg-muted !text-muted-foreground !hover:bg-muted"
                      )}
                    >
                      {listing.availabilityStatus === "available" && "Available Now"}
                      {listing.availabilityStatus === "limited" && "Limited Availability"}
                      {listing.availabilityStatus === "waitlist" && "Waitlist Only"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Enquiry Dialog for Desktop */}
              <Dialog open={enquiryDialogOpen} onOpenChange={setEnquiryDialogOpen}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="font-display">Send Enquiry</DialogTitle>
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
        </div>
      </div>

      {/* Mobile Sticky CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-md p-3 lg:hidden">
        <div className="flex gap-2">
          <Button variant="whatsapp" size="lg" className="flex-1" asChild>
            <a 
              href={whatsappLink} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={handleWhatsAppClick}
            >
              <MessageCircle className="h-5 w-5" />
              WhatsApp
            </a>
          </Button>
          <Button variant="call" size="lg" className="flex-1" asChild>
            <a href={buildCallLink()} onClick={handleCallClick}>
              <Phone className="h-5 w-5" />
              Call
            </a>
          </Button>
          <Button 
            variant="default" 
            size="lg" 
            className="flex-1"
            onClick={() => {
              handleEnquirySubmit();
              setEnquiryDialogOpen(true);
            }}
          >
            Enquire
          </Button>
        </div>
      </div>

      {/* Enquiry Dialog */}
      <Dialog open={enquiryDialogOpen} onOpenChange={setEnquiryDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Send Enquiry</DialogTitle>
          </DialogHeader>
          <EnquiryForm
            listingSlug={listing.slug}
            listingName={listing.displayName}
            locality={listing.localityId}
            source="listing-detail"
          />
        </DialogContent>
      </Dialog>

      {/* Visit Dialog */}
      <Dialog open={visitDialogOpen} onOpenChange={setVisitDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Schedule a Visit</DialogTitle>
          </DialogHeader>
          <VisitRequestForm
            listingSlug={listing.slug}
            listingName={listing.displayName}
            locality={listing.locality}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}