import { WorkspaceType, BudgetBand } from "@/types/models";

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

// Since filtering is now handled by the API, these functions are simplified
// They're kept for backward compatibility and client-side operations

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
