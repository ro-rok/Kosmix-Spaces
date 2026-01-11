import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X, Share2, Trash2, Heart, MessageCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { getShortlist, clearShortlist, removeFromShortlist, generateShareUrl } from "@/lib/shortlist";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { toast } from "sonner";

interface ShortlistDrawerProps {
  trigger?: React.ReactNode;
}

export function ShortlistDrawer({ trigger }: ShortlistDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="relative">
            <Heart className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Shortlist</span>
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display">Your Shortlist</SheetTitle>
          <SheetDescription>
            Save and manage your favorite workspace listings.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="py-12 text-center">
            <Heart className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 font-medium text-foreground">Shortlist Feature Coming Soon</p>
            <p className="mt-1 text-sm text-muted-foreground">
              For now, use WhatsApp to tell us about spaces you're interested in
            </p>
            <Button variant="whatsapp" className="mt-4" asChild>
              <a href={buildWhatsAppLink()} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" />
                WhatsApp Us
              </a>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
