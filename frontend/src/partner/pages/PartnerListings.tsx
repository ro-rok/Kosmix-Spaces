import { Link } from "react-router-dom";
import { Eye, Edit, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPartnerSession, getPartnerListings } from "@/lib/partnerStore";
import { StatusBadge } from "@/components/StatusBadge";
import { budgetBandLabels, workspaceTypeLabels } from "@/types/models";
import { AdminNotesPanel } from "@/components/AdminNotesPanel";

export function PartnerListings() {
  const session = getPartnerSession();
  const listings = session ? getPartnerListings(session.partnerId) : [];

  if (!session) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">My Listings</h1>
        <p className="text-muted-foreground">View and manage your workspace submissions</p>
      </div>

      {listings.length === 0 ? (
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
            {listings.map((listing) => (
              <Card key={listing.draftId}>
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
                          .map((t) => workspaceTypeLabels[t].split(" ")[0])
                          .join(", ")}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Budget</p>
                      <p className="font-medium">{budgetBandLabels[listing.budgetBand]}</p>
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
                  {listing.verificationStatus === "needs-info" && (
                    <AdminNotesPanel draft={listing} />
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link to={`/partner/listings/${listing.draftId}`}>
                        <Eye className="h-4 w-4" />
                        View
                      </Link>
                    </Button>
                    {listing.verificationStatus === "needs-info" && (
                      <Button asChild size="sm" className="flex-1">
                        <Link to={`/partner/listings/${listing.draftId}?edit=true`}>
                          <Edit className="h-4 w-4" />
                          Edit & Resubmit
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
                {listings.map((listing) => (
                  <TableRow key={listing.draftId}>
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
                            {workspaceTypeLabels[type].split(" ")[0]}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{budgetBandLabels[listing.budgetBand]}</TableCell>
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
                          <Link to={`/partner/listings/${listing.draftId}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {listing.verificationStatus === "needs-info" && (
                          <Button variant="ghost" size="icon" asChild>
                            <Link to={`/partner/listings/${listing.draftId}?edit=true`}>
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
