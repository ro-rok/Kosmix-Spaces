// Simple shortlist functionality using localStorage
const SHORTLIST_KEY = "kosmix_shortlist";

export function getShortlist(): string[] {
  try {
    const stored = localStorage.getItem(SHORTLIST_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function isInShortlist(slug: string): boolean {
  return getShortlist().includes(slug);
}

export function addToShortlist(slug: string): string[] {
  const current = getShortlist();
  if (!current.includes(slug)) {
    const updated = [...current, slug];
    localStorage.setItem(SHORTLIST_KEY, JSON.stringify(updated));
    return updated;
  }
  return current;
}

export function removeFromShortlist(slug: string): string[] {
  const current = getShortlist();
  const updated = current.filter((s) => s !== slug);
  localStorage.setItem(SHORTLIST_KEY, JSON.stringify(updated));
  return updated;
}

export function clearShortlist(): void {
  localStorage.setItem(SHORTLIST_KEY, JSON.stringify([]));
}

export function generateShareUrl(shortlist: string[]): string {
  if (shortlist.length === 0) return "";
  
  const baseUrl = window.location.origin;
  const params = new URLSearchParams();
  params.set("shortlist", shortlist.join(","));
  
  return `${baseUrl}/explore?${params.toString()}`;
}