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
  
  // Build structured message
  let message = `Hi Kosmix Spaces! 👋\n\n`;
  
  if (listingName) {
    message += `I'm interested in: *${listingName}*\n`;
  }
  
  if (locality) {
    const localityText = locality === "other-locality" 
      ? "another locality (not currently listed)" 
      : locality;
    message += `📍 Location: ${localityText}\n`;
  }
  
  if (teamSize) {
    message += `👥 Team Size: ${teamSize}\n`;
  }
  
  if (budgetBand) {
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
    message += `💰 Budget: ${budgetLabels[budgetBand] || budgetBand}\n`;
  }
  
  if (spaceType) {
    message += `🏢 Space Type: ${spaceType}\n`;
  }
  
  if (moveInDate) {
    const moveInLabels: Record<string, string> = {
      "immediate": "Immediate (within 1 week)",
      "1-2weeks": "1-2 weeks",
      "1month": "Within 1 month",
      "2-3months": "2-3 months",
      "exploring": "Just exploring"
    };
    message += `📅 Move-in: ${moveInLabels[moveInDate] || moveInDate}\n`;
  }
  
  message += `\nI'd like to schedule a visit. Please share available slots.`;
  
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
