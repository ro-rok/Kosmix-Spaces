import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocalities } from "@/hooks/useApi";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  onSearch?: (locality: string) => void;
  variant?: "hero" | "compact";
  initialValue?: string;
}

export function SearchBar({ onSearch, variant = "hero", initialValue = "" }: SearchBarProps) {
  const [query, setQuery] = useState(initialValue);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();
  
  const { data: localitiesData } = useLocalities();
  const localities = localitiesData || [];

  const filteredLocalities = useMemo(() => {
    if (!query.trim()) return localities.filter((l) => l.popular).slice(0, 6);
    return localities.filter((l) =>
      l.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [query, localities]);

  const handleSelect = (localityId: string) => {
    const locality = localities.find((l) => l.id === localityId);
    if (locality) {
      setQuery(locality.name);
      setShowSuggestions(false);
      if (onSearch) {
        onSearch(localityId);
      } else {
        navigate(`/explore?locality=${localityId}`);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const match = localities.find(
      (l) => l.name.toLowerCase() === query.toLowerCase()
    );
    if (match) {
      handleSelect(match.id);
    } else if (query.trim()) {
      navigate(`/explore?search=${encodeURIComponent(query)}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl border bg-background transition-all",
          variant === "hero"
            ? "border-border/50 p-2 shadow-lg focus-within:border-primary focus-within:shadow-xl"
            : "border-border p-1.5 shadow-sm focus-within:border-primary"
        )}
      >
        <div className="flex flex-1 items-center gap-2 px-3">
          <MapPin
            className={cn(
              "shrink-0 text-muted-foreground",
              variant === "hero" ? "h-5 w-5" : "h-4 w-4"
            )}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Search by locality in Delhi..."
            className={cn(
              "w-full bg-transparent outline-none placeholder:text-muted-foreground",
              variant === "hero" ? "text-base py-2" : "text-sm py-1"
            )}
          />
        </div>
        <Button
          type="submit"
          variant={variant === "hero" ? "default" : "default"}
          size={variant === "hero" ? "lg" : "sm"}
        >
          <Search className="h-4 w-4" />
          <span className={variant === "hero" ? "ml-2" : "sr-only"}>
            {variant === "hero" && "Search"}
          </span>
        </Button>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && filteredLocalities.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border border-border bg-background p-2 shadow-xl animate-fade-in">
          {!query.trim() && (
            <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
              Popular Localities
            </p>
          )}
          {filteredLocalities.map((locality) => (
            <button
              key={locality.id}
              type="button"
              onClick={() => handleSelect(locality.id)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
            >
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{locality.name}</span>
              <span className="text-muted-foreground">{locality.city}</span>
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
