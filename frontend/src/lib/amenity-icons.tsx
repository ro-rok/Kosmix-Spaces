import {
  Wifi,
  Car,
  Coffee,
  Printer,
  Shield,
  Clock,
  Users,
  Phone,
  Lock,
  Sofa,
  Utensils,
  Zap,
  Wind,
  Droplets,
  Camera,
  Headphones,
  Monitor,
  Gamepad2,
  Dumbbell,
  TreePine,
  Cigarette,
  Baby,
  PawPrint,
  Accessibility,
  MapPin,
  Building,
  Home,
  Briefcase,
  Mail,
  FileText,
  CheckCircle,
  Star,
  Sparkles,
  type LucideIcon
} from "lucide-react";

// Comprehensive amenity icon mapping
export const amenityIconMap: Record<string, LucideIcon> = {
  // Internet & Technology
  'wifi': Wifi,
  'high-speed-wifi': Wifi,
  'internet': Wifi,
  'broadband': Wifi,
  'fiber': Wifi,
  'printer': Printer,
  'scanner': Printer,
  'printer-scanner': Printer,
  'projector': Monitor,
  'tv': Monitor,
  'monitor': Monitor,
  'audio-visual': Monitor,
  'sound-system': Headphones,
  'microphone': Headphones,
  'speakers': Headphones,

  // Parking & Transportation
  'parking': Car,
  'car-parking': Car,
  'bike-parking': Car,
  'valet-parking': Car,
  'covered-parking': Car,

  // Food & Beverage
  'cafeteria': Coffee,
  'cafe': Coffee,
  'coffee': Coffee,
  'tea': Coffee,
  'kitchen': Utensils,
  'pantry': Utensils,
  'microwave': Utensils,
  'refrigerator': Utensils,
  'water-cooler': Droplets,
  'water-dispenser': Droplets,
  'dining-area': Utensils,
  'food-court': Utensils,

  // Security & Safety
  'security': Shield,
  '24-7-security': Shield,
  'cctv': Camera,
  'surveillance': Camera,
  'access-control': Lock,
  'keycard': Lock,
  'biometric': Lock,
  'fire-safety': Shield,
  'emergency-exit': Shield,

  // Reception & Support
  'reception': Users,
  '24-7-reception': Users,
  'front-desk': Users,
  'concierge': Users,
  'support-staff': Users,
  'admin-support': Users,

  // Comfort & Environment
  'air-conditioning': Wind,
  'ac': Wind,
  'heating': Zap,
  'climate-control': Wind,
  'ventilation': Wind,
  'power-backup': Zap,
  'ups': Zap,
  'generator': Zap,

  // Communication
  'phone-booth': Phone,
  'landline': Phone,
  'intercom': Phone,
  'video-calling': Phone,

  // Relaxation & Wellness
  'lounge': Sofa,
  'lounge-area': Sofa,
  'break-room': Sofa,
  'recreation': Gamepad2,
  'games': Gamepad2,
  'gym': Dumbbell,
  'fitness': Dumbbell,
  'wellness': Dumbbell,
  'meditation': TreePine,
  'quiet-zone': TreePine,

  // Storage & Facilities
  'lockers': Lock,
  'storage': Lock,
  'personal-storage': Lock,
  'mail-handling': Mail,
  'postal-service': Mail,

  // Cleaning & Maintenance
  'housekeeping': Sparkles,
  'cleaning': Sparkles,
  'daily-cleaning': Sparkles,
  'maintenance': FileText,

  // Accessibility & Special Needs
  'wheelchair-accessible': Accessibility,
  'disabled-access': Accessibility,
  'elevator': Building,
  'lift': Building,
  'ramp': Accessibility,

  // Policies & Restrictions
  'smoking-area': Cigarette,
  'no-smoking': Cigarette,
  'pet-friendly': PawPrint,
  'child-friendly': Baby,

  // Business Services
  'meeting-rooms': Briefcase,
  'conference-room': Briefcase,
  'boardroom': Briefcase,
  'presentation-room': Monitor,
  'training-room': Users,
  'event-space': Building,

  // Location & Access
  'metro-nearby': MapPin,
  'near-metro': MapPin,
  'bus-stop': MapPin,
  'taxi-service': Car,

  // Default fallback icons for common categories
  'default': CheckCircle,
  'premium': Star,
  'basic': CheckCircle,
  'standard': CheckCircle,
};

// Function to get icon for an amenity
export function getAmenityIcon(amenity: string): LucideIcon {
  const normalizedAmenity = amenity.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');
  
  // Try exact match first
  if (amenityIconMap[normalizedAmenity]) {
    return amenityIconMap[normalizedAmenity];
  }
  
  // Try partial matches for common keywords
  const keywords = [
    { keywords: ['wifi', 'internet', 'broadband'], icon: Wifi },
    { keywords: ['parking', 'car', 'vehicle'], icon: Car },
    { keywords: ['coffee', 'cafe', 'tea', 'beverage'], icon: Coffee },
    { keywords: ['print', 'scan', 'copy'], icon: Printer },
    { keywords: ['security', 'safe', 'guard'], icon: Shield },
    { keywords: ['reception', 'front', 'desk'], icon: Users },
    { keywords: ['phone', 'call', 'communication'], icon: Phone },
    { keywords: ['locker', 'storage', 'safe'], icon: Lock },
    { keywords: ['lounge', 'relax', 'break'], icon: Sofa },
    { keywords: ['kitchen', 'pantry', 'food'], icon: Utensils },
    { keywords: ['power', 'backup', 'generator', 'ups'], icon: Zap },
    { keywords: ['air', 'ac', 'cooling', 'climate'], icon: Wind },
    { keywords: ['water', 'cooler', 'dispenser'], icon: Droplets },
    { keywords: ['camera', 'cctv', 'surveillance'], icon: Camera },
    { keywords: ['audio', 'sound', 'speaker'], icon: Headphones },
    { keywords: ['monitor', 'screen', 'display', 'tv'], icon: Monitor },
    { keywords: ['game', 'recreation', 'entertainment'], icon: Gamepad2 },
    { keywords: ['gym', 'fitness', 'exercise'], icon: Dumbbell },
    { keywords: ['clean', 'housekeep', 'maintenance'], icon: Sparkles },
    { keywords: ['meeting', 'conference', 'boardroom'], icon: Briefcase },
    { keywords: ['metro', 'train', 'transport'], icon: MapPin },
  ];
  
  for (const { keywords: keywordList, icon } of keywords) {
    if (keywordList.some(keyword => normalizedAmenity.includes(keyword))) {
      return icon;
    }
  }
  
  // Default fallback
  return CheckCircle;
}

// Function to get amenity display name (optional, for consistency)
export function getAmenityDisplayName(amenity: string): string {
  return amenity
    .split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}