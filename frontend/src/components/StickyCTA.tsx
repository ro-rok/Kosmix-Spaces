import { MessageCircle, Phone, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildWhatsAppLink, buildCallLink } from "@/lib/whatsapp";

interface StickyCTAProps {
  listingName?: string;
  locality?: string;
  onRequestVisit?: () => void;
}

export function StickyCTA({ listingName, locality, onRequestVisit }: StickyCTAProps) {
  const whatsappLink = buildWhatsAppLink({ listingName, locality });

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 p-3 backdrop-blur-md md:hidden">
      <div className="flex gap-2">
        <Button variant="whatsapp" size="lg" className="flex-1" asChild>
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-5 w-5" />
            WhatsApp
          </a>
        </Button>
        <Button variant="call" size="lg" className="flex-1" asChild>
          <a href={buildCallLink()}>
            <Phone className="h-5 w-5" />
            Call
          </a>
        </Button>
        {onRequestVisit && (
          <Button variant="outline" size="lg" onClick={onRequestVisit}>
            <Calendar className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
