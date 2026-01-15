import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';

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
  const mapRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load Google Maps script if not already loaded
    const loadGoogleMaps = () => {
      if (window.google?.maps) {
        initializeMap();
        return;
      }

      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        setError('Google Maps API key not configured');
        return;
      }

      // Check if script is already loading
      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        const checkGoogle = setInterval(() => {
          if (window.google?.maps) {
            clearInterval(checkGoogle);
            initializeMap();
          }
        }, 100);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
      script.onerror = () => setError('Failed to load Google Maps');
      document.head.appendChild(script);
    };

    const initializeMap = () => {
      if (!mapRef.current || !window.google?.maps) return;

      try {
        // Use approximate coordinates if available, otherwise geocode the locality
        if (approximateCoordinates) {
          createMapWithCoordinates(approximateCoordinates);
        } else {
          geocodeAndCreateMap();
        }
      } catch (err) {
        console.error('Map initialization error:', err);
        setError('Failed to initialize map');
      }
    };

    const createMapWithCoordinates = (coords: { lat: number; lng: number }) => {
      if (!mapRef.current) return;

      const map = new window.google.maps.Map(mapRef.current, {
        center: coords,
        zoom: 14, // Good zoom level for locality view
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      // Add a circle to show approximate area instead of exact pin
      new window.google.maps.Circle({
        map: map,
        center: coords,
        radius: 500, // 500 meter radius for approximate location
        fillColor: '#00D9A5',
        fillOpacity: 0.2,
        strokeColor: '#00D9A5',
        strokeOpacity: 0.8,
        strokeWeight: 2,
      });

      // Add marker at center
      new window.google.maps.Marker({
        position: coords,
        map: map,
        title: `${locality}, ${city}`,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#00D9A5',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        }
      });
    };

    const geocodeAndCreateMap = () => {
      if (!window.google?.maps) return;

      const geocoder = new window.google.maps.Geocoder();
      const address = `${locality}, ${city}, India`;

      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results && results[0] && mapRef.current) {
          const location = results[0].geometry.location;
          createMapWithCoordinates({
            lat: location.lat(),
            lng: location.lng()
          });
        } else {
          console.error('Geocoding failed:', status);
          setError('Unable to locate address on map');
        }
      });
    };

    loadGoogleMaps();
  }, [locality, city, approximateCoordinates]);

  if (error) {
    return (
      <div className={`aspect-[16/9] bg-muted rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center">
          <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Approximate location</p>
          <p className="text-xs text-muted-foreground mt-1">
            {locality}, {city}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Exact address shared after enquiry
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`aspect-[16/9] bg-muted rounded-lg overflow-hidden ${className}`}>
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}

// Extend Window interface for Google Maps
declare global {
  interface Window {
    google?: {
      maps: {
        Map: any;
        Marker: any;
        Circle: any;
        Geocoder: any;
        SymbolPath: any;
      };
    };
  }
}


