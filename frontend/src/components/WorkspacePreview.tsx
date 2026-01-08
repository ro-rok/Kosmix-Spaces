import { Listing, budgetBandLabels, workspaceTypeLabels } from "@/types/models";
import { WorkspaceDraftListing } from "@/types/models";
import { Train, Zap, Car, Clock, FileText, Users, Wifi, Coffee, Shield, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkspacePreviewProps {
  listing: Listing | WorkspaceDraftListing;
  showActions?: boolean;
}

export function WorkspacePreview({ listing, showActions = false }: WorkspacePreviewProps) {
  const specs = [
    { icon: Users, label: "Capacity", value: `${listing.seatCapacityMin}-${listing.seatCapacityMax} seats` },
    { icon: Clock, label: "Access", value: listing.accessHours },
    { icon: Train, label: "Metro", value: listing.nearMetro ? listing.metroNote || "Near Metro" : "Not near metro" },
    { icon: Car, label: "Parking", value: listing.parking ? "Available" : "Not available" },
    { icon: Zap, label: "Power Backup", value: listing.powerBackup ? "Yes" : "No" },
    { icon: FileText, label: "GST Invoice", value: listing.gstInvoiceAvailable ? "Available" : "Not available" },
  ];

  return (
    <div className="space-y-6">
      {/* Photos */}
      {listing.photos.length > 0 && (
        <div className="rounded-lg border border-border overflow-hidden">
          <img
            src={listing.photos[0]}
            alt={listing.displayName}
            className="w-full aspect-[16/10] object-cover"
          />
          {listing.photos.length > 1 && (
            <div className="flex gap-2 p-2 bg-muted overflow-x-auto">
              {listing.photos.slice(1).map((photo, idx) => (
                <img
                  key={idx}
                  src={photo}
                  alt=""
                  className="h-16 w-24 object-cover rounded flex-shrink-0"
                />
              ))}
            </div>
          )}
        </div>
      )}

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

      {/* Budget Band */}
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">Budget Band</p>
        <p className="mt-1 font-display text-xl font-bold text-primary">
          {budgetBandLabels[listing.budgetBand]}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">On Enquiry</p>
      </div>

      {/* Deals */}
      {listing.dealTags && listing.dealTags.length > 0 && (
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
    </div>
  );
}
