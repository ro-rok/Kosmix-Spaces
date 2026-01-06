import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isInShortlist, addToShortlist, removeFromShortlist } from "@/lib/shortlist";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ShortlistButtonProps {
  slug: string;
  listingName: string;
  variant?: "icon" | "button";
  className?: string;
}

export function ShortlistButton({ slug, listingName, variant = "icon", className }: ShortlistButtonProps) {
  const [isShortlisted, setIsShortlisted] = useState(false);

  useEffect(() => {
    setIsShortlisted(isInShortlist(slug));
  }, [slug]);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isShortlisted) {
      removeFromShortlist(slug);
      setIsShortlisted(false);
      toast.success("Removed from shortlist");
    } else {
      addToShortlist(slug);
      setIsShortlisted(true);
      toast.success("Added to shortlist");
    }
  };

  if (variant === "icon") {
    return (
      <button
        onClick={handleToggle}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm transition-colors hover:bg-background",
          className
        )}
        aria-label={isShortlisted ? "Remove from shortlist" : "Add to shortlist"}
      >
        <Heart
          className={cn(
            "h-4 w-4 transition-colors",
            isShortlisted ? "fill-destructive text-destructive" : "text-foreground"
          )}
        />
      </button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      className={className}
    >
      <Heart
        className={cn(
          "h-4 w-4",
          isShortlisted ? "fill-destructive text-destructive" : ""
        )}
      />
      {isShortlisted ? "Saved" : "Save"}
    </Button>
  );
}
