import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X, Share2, Trash2, Heart, MessageCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { getShortlist, clearShortlist, removeFromShortlist, generateShareUrl } from "@/lib/shortlist";
import { listings } from "@/data/listings";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { toast } from "sonner";

interface ShortlistDrawerProps {
  trigger?: React.ReactNode;
}

export function ShortlistDrawer({ trigger }: ShortlistDrawerProps) {
  const [open, setOpen] = useState(false);
  const [shortlistSlugs, setShortlistSlugs] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setShortlistSlugs(getShortlist());
    }
  }, [open]);

  const shortlistedListings = listings.filter((l) => shortlistSlugs.includes(l.slug));

  const handleRemove = (slug: string) => {
    removeFromShortlist(slug);
    setShortlistSlugs(getShortlist());
  };

  const handleClear = () => {
    clearShortlist();
    setShortlistSlugs([]);
    toast.success("Shortlist cleared");
  };

  const handleShare = async () => {
    const url = generateShareUrl(shortlistSlugs);
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Share link copied to clipboard");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const whatsappLink = buildWhatsAppLink({
    customMessage: `Hi, I've shortlisted ${shortlistedListings.length} spaces: ${shortlistedListings.map((l) => l.displayName).join(", ")}. Please help me schedule visits.`,
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="relative">
            <Heart className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Shortlist</span>
            {shortlistSlugs.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {shortlistSlugs.length}
              </span>
            )}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display flex items-center justify-between">
            Your Shortlist
            {shortlistedListings.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                {shortlistedListings.length} {shortlistedListings.length === 1 ? "space" : "spaces"}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {shortlistedListings.length === 0 ? (
            <div className="py-12 text-center">
              <Heart className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 font-medium text-foreground">No spaces saved yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Click the heart icon on any listing to save it here
              </p>
              <Button variant="outline" className="mt-4" onClick={() => setOpen(false)} asChild>
                <Link to="/explore">Browse Spaces</Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleShare} className="flex-1">
                  <Share2 className="h-4 w-4" />
                  Share List
                </Button>
                <Button variant="outline" size="sm" onClick={handleClear}>
                  <Trash2 className="h-4 w-4" />
                  Clear
                </Button>
              </div>

              {/* Listings */}
              <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                {shortlistedListings.map((listing) => (
                  <div
                    key={listing.slug}
                    className="flex items-start gap-3 rounded-lg border border-border p-3"
                  >
                    <img
                      src={listing.photos[0]}
                      alt={listing.displayName}
                      className="h-16 w-20 rounded-md object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground text-sm line-clamp-1">
                        {listing.displayName}
                      </h4>
                      <p className="text-xs text-muted-foreground">{listing.locality}</p>
                      <div className="mt-2 flex gap-2">
                        <Link
                          to={`/spaces/${listing.slug}`}
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                          onClick={() => setOpen(false)}
                        >
                          View <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(listing.slug)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Remove from shortlist"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* WhatsApp CTA */}
              <div className="pt-4 border-t border-border">
                <Button variant="whatsapp" className="w-full" asChild>
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp About These Spaces
                  </a>
                </Button>
                <p className="mt-2 text-xs text-muted-foreground text-center">
                  We'll help you schedule visits for all shortlisted spaces
                </p>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
