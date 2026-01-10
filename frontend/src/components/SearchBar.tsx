import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocalities } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  onSearch?: (query: string) => void;
  onLocalitySelect?: (locality: string) => void;
  variant?: "hero" | "compact";
  initialValue?: string;
  showSuggestions?: boolean;
}

export function SearchBar({ 
  onSearch, 
  onLocalitySelect,
  variant = "hero", 
  initialValue = "",
  showSuggestions = true
}: SearchBarProps) {
  const [query, setQuery] = useState(initialValue);
  const [showDropdown, setShowDropdown] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const navigate = useNavigate();
  
  const debouncedQuery = useDebounce(query, 300);
  const { data: localitiesData } = useLocalities();
  const localities = localitiesData || [];

  // Call onSearch when debounced query changes
  useEffect(() => {
    if (onSearch && debouncedQuery !== initialValue) {
      onSearch(debouncedQuery);
    }
  }, [debouncedQuery, onSearch, initialValue]);

  const filteredLocalities = useMemo(() => {
    if (!query.trim()) return localities.filter((l) => l.popular).slice(0, 6);
    return localities.filter((l) =>
      l.name.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 8);
  }, [query, localities]);

  const handleSelect = (localityId: string) => {
    const locality = localities.find((l) => l.id === localityId);
    if (locality) {
      setQuery(locality.name);
      setShowDropdown(false);
      setFocusedIndex(-1);
      if (onLocalitySelect) {
        onLocalitySelect(localityId);
      } else {
        navigate(`/explore?locality=${localityId}`);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // If there's a focused suggestion, select it
    if (focusedIndex >= 0 && filteredLocalities[focusedIndex]) {
      handleSelect(filteredLocalities[focusedIndex].id);
      return;
    }
    
    // Try to find exact match
    const match = localities.find(
      (l) => l.name.toLowerCase() === query.toLowerCase()
    );
    if (match) {
      handleSelect(match.id);
    } else if (query.trim()) {
      // General search
      if (onSearch) {
        onSearch(query.trim());
      } else {
        navigate(`/explore?q=${encodeURIComponent(query.trim())}`);
      }
      setShowDropdown(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || filteredLocalities.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev < filteredLocalities.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Escape':
        setShowDropdown(false);
        setFocusedIndex(-1);
        break;
    }
  };

  const clearSearch = () => {
    setQuery('');
    setShowDropdown(false);
    setFocusedIndex(-1);
    if (onSearch) {
      onSearch('');
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
              setShowDropdown(true);
              setFocusedIndex(-1);
            }}
            onFocus={() => showSuggestions && setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            onKeyDown={handleKeyDown}
            placeholder="Search by locality or workspace name..."
            className={cn(
              "w-full bg-transparent outline-none placeholder:text-muted-foreground",
              variant === "hero" ? "text-base py-2" : "text-sm py-1"
            )}
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto p-1 hover:bg-transparent"
              onClick={clearSearch}
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </Button>
          )}
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
      {showDropdown && showSuggestions && filteredLocalities.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border border-border bg-background p-2 shadow-xl animate-fade-in">
          {!query.trim() && (
            <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
              Popular Localities
            </p>
          )}
          {filteredLocalities.map((locality, index) => (
            <button
              key={locality.id}
              type="button"
              onClick={() => handleSelect(locality.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                index === focusedIndex && "bg-muted"
              )}
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
