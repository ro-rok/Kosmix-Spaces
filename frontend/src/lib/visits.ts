// Visit request localStorage helpers

const VISITS_KEY = "kosmix_visit_requests";

export interface VisitRequest {
  id: string;
  listingSlug: string;
  listingName: string;
  locality: string;
  preferredDates: string[];
  timeWindow: "morning" | "afternoon" | "evening";
  visitorCount: number;
  name: string;
  phone: string;
  email?: string;
  createdAt: string;
  status: "pending" | "confirmed" | "rescheduled" | "completed" | "cancelled";
}

export function getVisitRequests(): VisitRequest[] {
  try {
    const stored = localStorage.getItem(VISITS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addVisitRequest(request: Omit<VisitRequest, "id" | "createdAt" | "status">): VisitRequest {
  const newRequest: VisitRequest = {
    ...request,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: "pending",
  };
  const current = getVisitRequests();
  localStorage.setItem(VISITS_KEY, JSON.stringify([...current, newRequest]));
  return newRequest;
}

export function updateVisitStatus(id: string, status: VisitRequest["status"]): void {
  const current = getVisitRequests();
  const updated = current.map((v) => (v.id === id ? { ...v, status } : v));
  localStorage.setItem(VISITS_KEY, JSON.stringify(updated));
}
