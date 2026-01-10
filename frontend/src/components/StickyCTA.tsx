import { MessageCircle, Phone, Calendar, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildWhatsAppLink, buildCallLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface StickyCTAProps {
  listingName?: string;
  locality?: string;
  onRequestVisit?: () => void;
  className?: string;
}

export function StickyCTA({ listingName, locality, onRequestVisit, className }: StickyCTAProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  const whatsappLink = buildWhatsAppLink({ listingName, locality });

  // Auto-hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show if scrolling up or at top
      if (currentScrollY < lastScrollY || currentScrollY < 100) {
        setIsVisible(true);
      } 
      // Hide if scrolling down and not at top
      else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <div 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-300 ease-in-out",
        isVisible ? "translate-y-0" : "translate-y-full",
        className
      )}
    >
      {/* Premium glass background with safe area */}
      <div className="glass border-t border-border/60 mobile-safe-bottom">
        <div className="container-spacing py-3">
          {/* Collapse indicator */}
          <div className="flex justify-center mb-2">
            <button
              onClick={() => setIsVisible(!isVisible)}
              className="p-1 rounded-full bg-muted/50 hover:bg-muted transition-colors"
              aria-label={isVisible ? "Hide actions" : "Show actions"}
            >
              <ChevronUp 
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform duration-200",
                  !isVisible && "rotate-180"
                )}
              />
            </button>
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-3">
            <Button 
              variant="whatsapp" 
              size="lg" 
              className="flex-1 btn-premium shadow-lg" 
              asChild
            >
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-5 w-5" />
                <span className="font-semibold">WhatsApp</span>
              </a>
            </Button>
            
            <Button 
              variant="call" 
              size="lg" 
              className="flex-1 btn-premium shadow-lg" 
              asChild
            >
              <a href={buildCallLink()}>
                <Phone className="h-5 w-5" />
                <span className="font-semibold">Call</span>
              </a>
            </Button>
            
            {onRequestVisit && (
              <Button 
                variant="outline" 
                size="lg" 
                onClick={onRequestVisit}
                className="btn-premium border-2 shadow-lg bg-background/90 backdrop-blur-sm"
              >
                <Calendar className="h-5 w-5" />
                <span className="sr-only">Schedule Visit</span>
              </Button>
            )}
          </div>
          
          {/* Listing info */}
          {listingName && (
            <div className="mt-2 text-center">
              <p className="text-xs text-muted-foreground">
                Enquiring about <span className="font-medium text-foreground">{listingName}</span>
                {locality && <span>, {locality}</span>}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Enhanced sticky CTA for listing detail pages
export function ListingStickyCTA({ 
  listingName, 
  locality, 
  onRequestVisit, 
  onEnquire,
  className 
}: StickyCTAProps & { onEnquire?: () => void }) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  const whatsappLink = buildWhatsAppLink({ listingName, locality });

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < lastScrollY || currentScrollY < 100) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <div 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 md:hidden transition-all duration-300 ease-in-out",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0",
        className
      )}
    >
      <div className="glass border-t border-border/60 mobile-safe-bottom">
        <div className="container-spacing py-4">
          {/* Primary actions */}
          <div className="flex gap-2 mb-3">
            <Button 
              variant="whatsapp" 
              size="lg" 
              className="flex-1 btn-premium shadow-lg" 
              asChild
            >
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-5 w-5" />
                WhatsApp
              </a>
            </Button>
            
            <Button 
              variant="call" 
              size="lg" 
              className="flex-1 btn-premium shadow-lg" 
              asChild
            >
              <a href={buildCallLink()}>
                <Phone className="h-5 w-5" />
                Call
              </a>
            </Button>
          </div>
          
          {/* Secondary actions */}
          <div className="flex gap-2">
            {onEnquire && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onEnquire}
                className="flex-1 btn-premium border-2 bg-background/90 backdrop-blur-sm"
              >
                Send Enquiry
              </Button>
            )}
            
            {onRequestVisit && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRequestVisit}
                className="flex-1 btn-premium border-2 bg-background/90 backdrop-blur-sm"
              >
                <Calendar className="h-4 w-4" />
                Schedule Visit
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
