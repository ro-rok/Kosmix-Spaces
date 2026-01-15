import { contactConfig } from "@/config/contact";

interface WhatsAppMessageParams {
  listingName?: string;
  locality?: string;
  teamSize?: string;
  budgetBand?: string;
  spaceType?: string;
  moveInDate?: string;
  customMessage?: string;
}

export function buildWhatsAppLink(params: WhatsAppMessageParams = {}): string {
  const { listingName, locality, teamSize, budgetBand, spaceType, moveInDate, customMessage } = params;
  
  // If custom message provided, use it directly
  if (customMessage) {
    const encodedMessage = encodeURIComponent(customMessage);
    return `https://wa.me/${contactConfig.whatsappNumber}?text=${encodedMessage}`;
  }
  
  let message = "Hi Kosmix Spaces! I'm looking for workspace";
  
  if (listingName || locality) {
    if (listingName) {
      message += ` (interested in: ${listingName})`;
    } else if (locality) {
      // Handle "other-locality" specially
      const localityText = locality === "other-locality" 
        ? "other locality (not currently listed)" 
        : locality;
      message += ` in ${localityText}`;
    }
  }
  
  message += ".\n\n";
  
  if (teamSize) message += `Team size: ${teamSize}\n`;
  if (budgetBand) message += `Budget: ${budgetBand}\n`;
  if (spaceType) message += `Space type: ${spaceType}\n`;
  if (moveInDate) message += `Move-in: ${moveInDate}\n`;
  
  message += "\nPlease help me shortlist options.";
  
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
