import { Listing, WorkspaceType, BudgetBand } from "@/data/listings";

export interface FilterState {
  locality: string;
  budgetBand: BudgetBand | "";
  teamSize: string;
  spaceType: WorkspaceType | "";
  nearMetro: boolean;
  parking: boolean;
  powerBackup: boolean;
  gstInvoice: boolean;
}

export type SortOption = "best-match" | "budget-low" | "recently-verified";

export const initialFilterState: FilterState = {
  locality: "",
  budgetBand: "",
  teamSize: "",
  spaceType: "",
  nearMetro: false,
  parking: false,
  powerBackup: false,
  gstInvoice: false,
};

const budgetOrder: BudgetBand[] = ["5k-10k", "10k-20k", "20k-40k", "40k-80k", "80k+"];

export function applyFilters(listings: Listing[], filters: FilterState): Listing[] {
  return listings.filter((listing) => {
    // Locality filter
    if (filters.locality && listing.localityId !== filters.locality) {
      return false;
    }
    
    // Budget band filter
    if (filters.budgetBand && listing.budgetBand !== filters.budgetBand) {
      return false;
    }
    
    // Team size filter
    if (filters.teamSize) {
      const [min, max] = parseTeamSize(filters.teamSize);
      if (listing.seatCapacityMax < min || listing.seatCapacityMin > max) {
        return false;
      }
    }
    
    // Space type filter
    if (filters.spaceType && !listing.workspaceTypes.includes(filters.spaceType)) {
      return false;
    }
    
    // Toggle filters
    if (filters.nearMetro && !listing.nearMetro) return false;
    if (filters.parking && !listing.parking) return false;
    if (filters.powerBackup && !listing.powerBackup) return false;
    if (filters.gstInvoice && !listing.gstInvoiceAvailable) return false;
    
    return true;
  });
}

export function sortListings(listings: Listing[], sort: SortOption): Listing[] {
  const sorted = [...listings];
  
  switch (sort) {
    case "budget-low":
      return sorted.sort((a, b) => {
        return budgetOrder.indexOf(a.budgetBand) - budgetOrder.indexOf(b.budgetBand);
      });
    
    case "recently-verified":
      return sorted.sort((a, b) => {
        // Verified first, then by date
        if (a.verificationStatus === "verified" && b.verificationStatus !== "verified") return -1;
        if (b.verificationStatus === "verified" && a.verificationStatus !== "verified") return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    
    case "best-match":
    default:
      // Best match: verified first, then available, then by date
      return sorted.sort((a, b) => {
        // Verified priority
        if (a.verificationStatus === "verified" && b.verificationStatus !== "verified") return -1;
        if (b.verificationStatus === "verified" && a.verificationStatus !== "verified") return 1;
        
        // Availability priority
        const availOrder = { available: 0, limited: 1, waitlist: 2 };
        const availDiff = availOrder[a.availabilityStatus] - availOrder[b.availabilityStatus];
        if (availDiff !== 0) return availDiff;
        
        // Date
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }
}

function parseTeamSize(teamSize: string): [number, number] {
  switch (teamSize) {
    case "1-5": return [1, 5];
    case "6-15": return [6, 15];
    case "16-30": return [16, 30];
    case "31-50": return [31, 50];
    case "50+": return [50, 999];
    default: return [0, 999];
  }
}

export function hasActiveFilters(filters: FilterState): boolean {
  return (
    !!filters.locality ||
    !!filters.budgetBand ||
    !!filters.teamSize ||
    !!filters.spaceType ||
    filters.nearMetro ||
    filters.parking ||
    filters.powerBackup ||
    filters.gstInvoice
  );
}
