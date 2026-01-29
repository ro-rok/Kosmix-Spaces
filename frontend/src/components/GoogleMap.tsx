import { useMemo } from 'react';
import { MapPin, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GoogleMapProps {
  locality: string;
  city: string;
  approximateCoordinates?: {
    lat: number;
    lng: number;
  };
  className?: string;
}

export function GoogleMap({ locality, city, approximateCoordinates, className = '' }: GoogleMapProps) {
  // Generate Google Maps iframe URL (works without API key)
  // Using Google Maps search URL which can be embedded
  const embedUrl = useMemo(() => {
    const query = approximateCoordinates
      ? `${approximateCoordinates.lat},${approximateCoordinates.lng}`
      : encodeURIComponent(`${locality}, ${city}, India`);
    
    // Use Google Maps URL - this format works in iframes without API key
    // The iframe will show an interactive map
    return `https://maps.google.com/maps?q=${query}&hl=en&z=14&output=embed`;
  }, [locality, city, approximateCoordinates]);

  // Generate Google Maps search URL for "View on Google Maps" link
  const mapsSearchUrl = useMemo(() => {
    const query = approximateCoordinates
      ? `${approximateCoordinates.lat},${approximateCoordinates.lng}`
      : encodeURIComponent(`${locality}, ${city}, India`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  }, [locality, city, approximateCoordinates]);

  return (
    <div className={`aspect-[16/9] bg-muted rounded-lg overflow-hidden relative group ${className}`}>
      <iframe
        src={embedUrl}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="w-full h-full"
        title={`Map showing ${locality}, ${city}`}
      />
      
      {/* Overlay with location info and link - shows on hover */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/95 via-background/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="text-sm font-medium text-foreground">
              {locality}, {city}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="h-8 text-xs flex-shrink-0"
          >
            <a
              href={mapsSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1"
            >
              View on Google Maps
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Exact address shared after enquiry
        </p>
      </div>
      
      {/* Always visible location badge in corner */}
      <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm rounded-md px-2 py-1.5 shadow-sm">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium text-foreground">
            {locality}, {city}
          </span>
        </div>
      </div>
    </div>
  );
}
