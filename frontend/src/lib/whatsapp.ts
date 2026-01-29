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
  
  // Build professional, high-converting message template
  let message = `Hi Kosmix Spaces! 👋\n\n`;
  
  // Listing context (if available)
  if (listingName) {
    message += `I'm interested in: *${listingName}*\n`;
  }
  
  // Location context
  if (locality) {
    const localityText = locality === "other-locality" 
      ? "another locality (not currently listed)" 
      : locality;
    message += `📍 Location: ${localityText}\n`;
  }
  
  // User needs (team size, budget, space type, move-in)
  const needs: string[] = [];
  
  if (teamSize) {
    needs.push(`Team: ${teamSize}`);
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
    needs.push(`Budget: ${budgetLabels[budgetBand] || budgetBand}`);
  }
  
  if (spaceType) {
    needs.push(`Type: ${spaceType}`);
  }
  
  if (moveInDate) {
    const moveInLabels: Record<string, string> = {
      "immediate": "Immediate (within 1 week)",
      "1-2weeks": "1-2 weeks",
      "1month": "Within 1 month",
      "2-3months": "2-3 months",
      "exploring": "Just exploring"
    };
    needs.push(`Move-in: ${moveInLabels[moveInDate] || moveInDate}`);
  }
  
  if (needs.length > 0) {
    message += `\nRequirements:\n${needs.map(n => `• ${n}`).join('\n')}\n`;
  }
  
  // Clear call to action
  message += `\nPlease help me find the best options and schedule a visit.`;
  
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
