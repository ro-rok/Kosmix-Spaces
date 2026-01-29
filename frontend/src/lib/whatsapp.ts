import { contactConfig } from "@/config/contact";

interface WhatsAppMessageParams {
  listingName?: string;
  locality?: string | string[];
  city?: string | string[];
  teamSize?: string;
  budgetBand?: string | string[];
  spaceType?: string;
  moveInDate?: string;
  customMessage?: string;
  searchQuery?: string;
  messageType?: 'general' | 'listing' | 'visit' | 'partner' | 'search';
  // Visit request specific fields
  visitDates?: string[];
  visitTime?: string;
  visitorCount?: string;
  visitorName?: string;
  visitorPhone?: string;
  visitorEmail?: string;
}

type MessageType = 'general' | 'listing' | 'visit' | 'partner' | 'search';

/**
 * Format locality for display
 */
function formatLocality(locality: string | string[] | undefined): string {
  if (!locality) return '';
  if (Array.isArray(locality)) {
    return locality.filter(Boolean).join(', ');
  }
  if (locality === "other-locality") {
    return "another locality (not currently listed)";
  }
  return locality;
}

/**
 * Format city for display
 */
function formatCity(city: string | string[] | undefined): string {
  if (!city) return '';
  if (Array.isArray(city)) {
    return city.filter(Boolean).join(', ');
  }
  return city;
}

/**
 * Get budget label from budget band ID
 */
function getBudgetLabel(band: string): string {
  const budgetLabels: Record<string, string> = {
    "₹": "Under ₹10k",
    "₹₹": "₹10k - ₹25k",
    "₹₹₹": "₹25k+",
    "5k-10k": "₹5k - ₹10k",
    "10k-20k": "₹10k - ₹20k",
    "20k-40k": "₹20k - ₹40k",
    "40k-80k": "₹40k - ₹80k",
    "80k+": "₹80k+"
  };
  return budgetLabels[band] || band;
}

/**
 * Get move-in date label
 */
function getMoveInLabel(date: string): string {
  const moveInLabels: Record<string, string> = {
    "immediate": "Immediate (within 1 week)",
    "1-2weeks": "1-2 weeks",
    "1month": "Within 1 month",
    "2-3months": "2-3 months",
    "exploring": "Just exploring"
  };
  return moveInLabels[date] || date;
}

/**
 * Build general enquiry message
 */
function buildGeneralEnquiryMessage(params: WhatsAppMessageParams): string {
  let message = `Hi Kosmix Spaces! 👋\n\n`;
  
  const locality = formatLocality(params.locality);
  const city = formatCity(params.city);
  
  // Context section
  if (params.listingName) {
    message += `I'm interested in: *${params.listingName}*\n`;
  } else if (locality || city) {
    message += `I'm looking for a workspace`;
    if (locality) {
      message += ` in ${locality}`;
    }
    if (city && !locality) {
      message += ` in ${city}`;
    }
    message += `.\n`;
  } else {
    message += `I'm looking for a workspace.\n`;
  }
  
  // Requirements section
  const needs: string[] = [];
  
  if (params.teamSize) {
    needs.push(`Team size: ${params.teamSize}`);
  }
  
  if (params.budgetBand) {
    if (Array.isArray(params.budgetBand)) {
      const budgets = params.budgetBand.map(getBudgetLabel).join(', ');
      needs.push(`Budget: ${budgets}`);
    } else {
      needs.push(`Budget: ${getBudgetLabel(params.budgetBand)}`);
    }
  }
  
  if (params.spaceType) {
    needs.push(`Space type: ${params.spaceType}`);
  }
  
  if (params.moveInDate) {
    needs.push(`Move-in: ${getMoveInLabel(params.moveInDate)}`);
  }
  
  if (needs.length > 0) {
    message += `\n📋 Requirements:\n${needs.map(n => `• ${n}`).join('\n')}\n`;
  }
  
  // Call to action
  message += `\nPlease help me find the best options and schedule a visit.`;
  
  return message;
}

/**
 * Build listing-specific enquiry message
 */
function buildListingEnquiryMessage(params: WhatsAppMessageParams): string {
  let message = `Hi Kosmix Spaces! 👋\n\n`;
  
  if (params.listingName) {
    message += `I'm interested in *${params.listingName}*`;
    const locality = formatLocality(params.locality);
    if (locality) {
      message += ` in ${locality}`;
    }
    message += `.\n\n`;
  }
  
  // Requirements if provided
  const needs: string[] = [];
  
  if (params.teamSize) {
    needs.push(`Team size: ${params.teamSize}`);
  }
  
  if (params.budgetBand) {
    if (Array.isArray(params.budgetBand)) {
      const budgets = params.budgetBand.map(getBudgetLabel).join(', ');
      needs.push(`Budget: ${budgets}`);
    } else {
      needs.push(`Budget: ${getBudgetLabel(params.budgetBand)}`);
    }
  }
  
  if (params.moveInDate) {
    needs.push(`Move-in: ${getMoveInLabel(params.moveInDate)}`);
  }
  
  if (needs.length > 0) {
    message += `📋 My requirements:\n${needs.map(n => `• ${n}`).join('\n')}\n\n`;
  }
  
  message += `Could you please share more details and help me schedule a visit?`;
  
  return message;
}

/**
 * Build visit request message
 */
function buildVisitRequestMessage(params: WhatsAppMessageParams): string {
  let message = `Hi Kosmix Spaces! 👋\n\n`;
  
  if (params.listingName) {
    const locality = formatLocality(params.locality);
    message += `I'd like to schedule a visit for *${params.listingName}*`;
    if (locality) {
      message += ` in ${locality}`;
    }
    message += `.\n\n`;
  } else {
    message += `I'd like to schedule a workspace visit.\n\n`;
  }
  
  // Visit details
  if (params.visitDates && params.visitDates.length > 0) {
    const dates = params.visitDates.map(date => {
      try {
        return new Date(date).toLocaleDateString("en-IN", { 
          day: "numeric", 
          month: "short",
          weekday: "short"
        });
      } catch {
        return date;
      }
    }).join(", ");
    message += `📅 Preferred dates: ${dates}\n`;
  }
  
  if (params.visitTime) {
    message += `⏰ Preferred time: ${params.visitTime}\n`;
  }
  
  if (params.visitorCount) {
    message += `👥 Visitors: ${params.visitorCount}\n`;
  }
  
  // Contact info
  if (params.visitorName || params.visitorPhone || params.visitorEmail) {
    message += `\n`;
    if (params.visitorName) {
      message += `${params.visitorName}\n`;
    }
    if (params.visitorPhone) {
      message += `📱 ${params.visitorPhone}\n`;
    }
    if (params.visitorEmail) {
      message += `📧 ${params.visitorEmail}\n`;
    }
  }
  
  message += `\nLooking forward to hearing from you!`;
  
  return message;
}

/**
 * Build partner enquiry message
 */
function buildPartnerEnquiryMessage(params: WhatsAppMessageParams): string {
  let message = `Hi Kosmix Spaces! 👋\n\n`;
  
  message += `I'm interested in partnering with Kosmix Spaces to list my workspace.\n\n`;
  
  const locality = formatLocality(params.locality);
  if (locality) {
    message += `📍 Location: ${locality}\n`;
  }
  
  if (params.listingName && params.listingName !== "[Partner Enquiry]") {
    message += `🏢 Workspace: ${params.listingName}\n`;
  }
  
  message += `\nCould you please share more information about the partnership program and how we can get started?`;
  
  return message;
}

/**
 * Build search-based enquiry message
 */
function buildSearchEnquiryMessage(params: WhatsAppMessageParams): string {
  let message = `Hi Kosmix Spaces! 👋\n\n`;
  
  message += `I'm looking for a workspace`;
  
  const locality = formatLocality(params.locality);
  const city = formatCity(params.city);
  
  if (locality) {
    message += ` in ${locality}`;
  } else if (city) {
    message += ` in ${city}`;
  }
  message += `.\n\n`;
  
  // Search query context
  if (params.searchQuery) {
    message += `🔍 I searched for: "${params.searchQuery}"\n`;
  }
  
  // Requirements
  const needs: string[] = [];
  
  if (params.teamSize) {
    needs.push(`Team size: ${params.teamSize}`);
  }
  
  if (params.budgetBand) {
    if (Array.isArray(params.budgetBand)) {
      const budgets = params.budgetBand.map(getBudgetLabel).join(', ');
      needs.push(`Budget: ${budgets}`);
    } else {
      needs.push(`Budget: ${getBudgetLabel(params.budgetBand)}`);
    }
  }
  
  if (params.spaceType) {
    needs.push(`Space type: ${params.spaceType}`);
  }
  
  if (needs.length > 0) {
    message += `\n📋 Requirements:\n${needs.map(n => `• ${n}`).join('\n')}\n`;
  }
  
  message += `\nCould you help me find suitable options?`;
  
  return message;
}

/**
 * Build WhatsApp link with improved message templates
 */
export function buildWhatsAppLink(params: WhatsAppMessageParams = {}): string {
  const { customMessage, messageType } = params;
  
  // If custom message provided, use it directly
  if (customMessage) {
    const encodedMessage = encodeURIComponent(customMessage);
    return `https://wa.me/${contactConfig.whatsappNumber}?text=${encodedMessage}`;
  }
  
  // Determine message type if not explicitly provided
  let type: MessageType = messageType || 'general';
  
  if (!messageType) {
    if (params.visitDates || params.visitTime || params.visitorCount) {
      type = 'visit';
    } else if (params.listingName === "[Partner Enquiry]") {
      type = 'partner';
    } else if (params.listingName) {
      type = 'listing';
    } else if (params.searchQuery) {
      type = 'search';
    }
  }
  
  // Build message based on type
  let message: string;
  
  switch (type) {
    case 'visit':
      message = buildVisitRequestMessage(params);
      break;
    case 'listing':
      message = buildListingEnquiryMessage(params);
      break;
    case 'partner':
      message = buildPartnerEnquiryMessage(params);
      break;
    case 'search':
      message = buildSearchEnquiryMessage(params);
      break;
    case 'general':
    default:
      message = buildGeneralEnquiryMessage(params);
      break;
  }
  
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${contactConfig.whatsappNumber}?text=${encodedMessage}`;
}

export function buildCallLink(): string {
  return `tel:${contactConfig.phoneNumber.replace(/\s/g, "")}`;
}

export function buildEmailLink(subject?: string): string {
  const subjectParam = subject ? `?subject=${encodeURIComponent(subject)}` : "";
  return `mailto:${contactConfig.email}${subjectParam}`;
}
