import { Link } from "react-router-dom";
import { Eye, Edit, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePartnerListings } from "@/hooks/useAuth";
import { StatusBadge } from "@/components/StatusBadge";
import { backendBudgetBandLabels, backendWorkspaceTypeLabels } from "@/types/models";
import { AdminNotesPanel } from "@/components/AdminNotesPanel";

export function PartnerListings() {
  const { data: listings, isLoading, error } = usePartnerListings();
  const listingsArray = listings || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">My Listings</h1>
          <p className="text-muted-foreground">View and manage your workspace submissions</p>
        </div>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading listings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">My Listings</h1>
          <p className="text-muted-foreground">View and manage your workspace submissions</p>
        </div>
        <div className="text-center py-8">
          <p className="text-destructive">Error loading listings: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="font-display text-2xl font-bold text-foreground">My Listings</h1>
        <p className="text-muted-premium">View and manage your workspace submissions</p>
      </div>

      {listingsArray.length === 0 ? (
        <div className="card-premium animate-slide-up">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">
              No submissions yet
            </h3>
            <p className="text-muted-premium mb-4">
              Start by submitting your first workspace listing
            </p>
            <Button asChild className="btn-premium">
              <Link to="/partner/listings/new">Submit Your First Listing</Link>
            </Button>
          </CardContent>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Mobile Card View */}
          <div className="block md:hidden space-y-4">
            {listingsArray.map((listing, index) => (
              <div key={listing.listingId} className="card-premium card-hover animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base font-display">{listing.displayName}</CardTitle>
                      <CardDescription className="text-muted-premium">{listing.locality}</CardDescription>
                    </div>
                    <StatusBadge status={listing.verificationStatus} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="space-y-1">
                      <p className="text-muted-premium font-medium">Types</p>
                      <p className="font-medium text-foreground">
                        {listing.offerings ? Object.keys(listing.offerings)
                          .filter(key => listing.offerings[key]?.enabled)
                          .map(type => type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()))
                          .join(", ") : 'Not specified'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-premium font-medium">Budget</p>
                      <p className="font-medium text-foreground">
                        {listing.offerings && Object.values(listing.offerings).some(o => o?.startingPrice) 
                          ? `From ₹${Math.min(...Object.values(listing.offerings)
                              .filter(o => o?.startingPrice)
                              .map(o => o.startingPrice))}`
                          : 'On Enquiry'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-premium">
                      Updated: {listing.updatedAt ? new Date(listing.updatedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }) : 'Unknown'}
                    </p>
                  </div>
                  
                  {listing.verificationStatus === "NEEDS_INFO" && listing.adminNotes && (
                    <AdminNotesPanel listing={listing} />
                  )}
                  
                  <div className="flex gap-2 pt-2">
                    <Button asChild variant="outline" size="sm" className="flex-1 btn-premium">
                      <Link to={`/partner/listings/${listing.listingId}`}>
                        <Eye className="h-4 w-4" />
                        View
                      </Link>
                    </Button>
                    {(listing.verificationStatus === "NEEDS_INFO" || 
                      listing.verificationStatus === "PENDING_REVIEW" ||
                      listing.verificationStatus === "REJECTED" ||
                      listing.verificationStatus === "APPROVED" ||
                      listing.verificationStatus === "APPROVED_VERIFIED") && (
                      <Button asChild size="sm" className="flex-1 btn-premium">
                        <Link to={`/partner/listings/${listing.listingId}?edit=true`}>
                          <Edit className="h-4 w-4" />
                          {listing.verificationStatus === "NEEDS_INFO" ? "Edit & Resubmit" : 
                           (listing.verificationStatus === "APPROVED" || listing.verificationStatus === "APPROVED_VERIFIED") ? "Re-edit" :
                           "Edit"}
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block card-premium overflow-hidden animate-slide-up">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-display font-semibold">Listing</TableHead>
                  <TableHead className="font-display font-semibold">Locality</TableHead>
                  <TableHead className="font-display font-semibold">Types</TableHead>
                  <TableHead className="font-display font-semibold">Budget</TableHead>
                  <TableHead className="font-display font-semibold">Status</TableHead>
                  <TableHead className="font-display font-semibold">Updated</TableHead>
                  <TableHead className="text-right font-display font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listingsArray.map((listing, index) => (
                  <TableRow key={listing.listingId} className="hover:bg-muted/30 transition-colors animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                    <TableCell>
                      <div>
                        <p className="font-medium font-display">{listing.displayName}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-premium">{listing.locality}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {listing.offerings ? Object.keys(listing.offerings)
                          .filter(key => listing.offerings[key]?.enabled)
                          .slice(0, 2)
                          .map((type) => (
                            <span key={type} className="text-xs bg-muted/50 px-2 py-0.5 rounded-full border border-border/50">
                              {type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          )) : []}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {listing.offerings && Object.values(listing.offerings).some(o => o?.startingPrice) 
                        ? `From ₹${Math.min(...Object.values(listing.offerings)
                            .filter(o => o?.startingPrice)
                            .map(o => o.startingPrice))}`
                        : 'On Enquiry'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={listing.verificationStatus} />
                    </TableCell>
                    <TableCell className="text-muted-premium text-sm">
                      {listing.updatedAt ? new Date(listing.updatedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      }) : 'Unknown'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon-sm" asChild className="btn-premium">
                          <Link to={`/partner/listings/${listing.listingId}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {(listing.verificationStatus === "NEEDS_INFO" || 
                          listing.verificationStatus === "PENDING_REVIEW" ||
                          listing.verificationStatus === "REJECTED" ||
                          listing.verificationStatus === "APPROVED" ||
                          listing.verificationStatus === "APPROVED_VERIFIED") && (
                          <Button variant="ghost" size="icon-sm" asChild className="btn-premium">
                            <Link to={`/partner/listings/${listing.listingId}?edit=true`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
