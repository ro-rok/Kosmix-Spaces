import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ListingCard } from "@/components/ListingCard";
import { Skeleton } from "@/components/ui/skeleton";

interface RelatedListingsProps {
  listingSlug: string;
  locality: string;
}

export function RelatedListings({ listingSlug, locality }: RelatedListingsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["related-listings", listingSlug],
    queryFn: () => api.public.getRelatedListings(listingSlug, 6),
    enabled: !!listingSlug
  });
  
  if (isLoading) {
    return (
      <section className="space-y-6">
        <h2 className="font-display text-2xl font-semibold text-foreground">
          You may also like
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </section>
    );
  }
  
  if (!data?.items?.length) {
    return null;
  }
  
  return (
    <section className="space-y-6">
      <h2 className="font-display text-2xl font-semibold text-foreground">
        You may also like
      </h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.items.map((listing: any, index: number) => (
          <ListingCard
            key={listing.slug}
            listing={listing}
            variant="premium"
            enableScrollAnimation={false}
          />
        ))}
      </div>
    </section>
  );
}
