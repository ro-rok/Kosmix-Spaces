// Shortlist localStorage helpers

const SHORTLIST_KEY = "kosmix_shortlist";

export function getShortlist(): string[] {
  try {
    const stored = localStorage.getItem(SHORTLIST_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
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

export function isInShortlist(slug: string): boolean {
  return getShortlist().includes(slug);
}

export function clearShortlist(): void {
  localStorage.setItem(SHORTLIST_KEY, JSON.stringify([]));
}

export function generateShareUrl(slugs: string[]): string {
  const params = new URLSearchParams();
  params.set("shortlist", slugs.join(","));
  return `${window.location.origin}/explore?${params.toString()}`;
}

export function parseShareUrl(url: string): string[] {
  try {
    const urlObj = new URL(url);
    const shortlistParam = urlObj.searchParams.get("shortlist");
    return shortlistParam ? shortlistParam.split(",").filter(Boolean) : [];
  } catch {
    return [];
  }
}
