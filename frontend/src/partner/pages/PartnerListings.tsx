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
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">My Listings</h1>
        <p className="text-muted-foreground">View and manage your workspace submissions</p>
      </div>

      {listingsArray.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">
              No submissions yet
            </h3>
            <p className="text-muted-foreground mb-4">
              Start by submitting your first workspace listing
            </p>
            <Button asChild>
              <Link to="/partner/listings/new">Submit Your First Listing</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Mobile Card View */}
          <div className="block md:hidden space-y-4">
            {listingsArray.map((listing) => (
              <Card key={listing.listingId}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{listing.displayName}</CardTitle>
                      <CardDescription>{listing.locality}</CardDescription>
                    </div>
                    <StatusBadge status={listing.verificationStatus} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Types</p>
                      <p className="font-medium">
                        {listing.workspaceTypes
                          .map((t) => backendWorkspaceTypeLabels[t]?.split(" ")[0] || t)
                          .join(", ")}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Budget</p>
                      <p className="font-medium">{backendBudgetBandLabels[listing.budgetBandId] || listing.budgetBandId}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Updated: {new Date(listing.updatedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  {listing.verificationStatus === "NEEDS_INFO" && listing.adminNotes && (
                    <AdminNotesPanel draft={listing} />
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link to={`/partner/listings/${listing.listingId}`}>
                        <Eye className="h-4 w-4" />
                        View
                      </Link>
                    </Button>
                    {(listing.verificationStatus === "NEEDS_INFO" || 
                      listing.verificationStatus === "PENDING_REVIEW" ||
                      listing.verificationStatus === "REJECTED") && (
                      <Button asChild size="sm" className="flex-1">
                        <Link to={`/partner/listings/${listing.listingId}?edit=true`}>
                          <Edit className="h-4 w-4" />
                          {listing.verificationStatus === "NEEDS_INFO" ? "Edit & Resubmit" : "Edit"}
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block rounded-lg border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Listing</TableHead>
                  <TableHead>Locality</TableHead>
                  <TableHead>Types</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listingsArray.map((listing) => (
                  <TableRow key={listing.listingId}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{listing.displayName}</p>
                      </div>
                    </TableCell>
                    <TableCell>{listing.locality}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {listing.workspaceTypes.slice(0, 2).map((type) => (
                          <span key={type} className="text-xs bg-muted px-2 py-0.5 rounded">
                            {backendWorkspaceTypeLabels[type]?.split(" ")[0] || type}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{backendBudgetBandLabels[listing.budgetBandId] || listing.budgetBandId}</TableCell>
                    <TableCell>
                      <StatusBadge status={listing.verificationStatus} />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(listing.updatedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/partner/listings/${listing.listingId}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {(listing.verificationStatus === "NEEDS_INFO" || 
                          listing.verificationStatus === "PENDING_REVIEW" ||
                          listing.verificationStatus === "REJECTED") && (
                          <Button variant="ghost" size="icon" asChild>
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
