import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Eye, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Filter,
  Search,
  MoreHorizontal,
  FileText,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { PageLoadingAnimation } from "@/components/LoadingAnimation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAdminPremiumListings, useApprovePremiumListing, useNeedsInfoPremiumListing, useRejectPremiumListing, useDeleteListing } from "@/hooks/useAuth";
import { trackAdminVerificationAction } from "@/lib/analytics";
import { toast } from "sonner";

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING", label: "Pending" },
  { value: "SUBMITTED", label: "Submitted for Review" },
  { value: "PENDING_REVIEW", label: "Pending Review" },
  { value: "NEEDS_INFO", label: "Needs Info" },
  { value: "APPROVED_VERIFIED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "SUSPENDED", label: "Suspended" },
];

export function AdminListings() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // Fetch premium listings from API
  const { 
    data: listings, 
    isLoading, 
    error 
  } = useAdminPremiumListings({
    status: statusFilter === "all" ? undefined : statusFilter,
    page,
    pageSize
  });

  const approveMutation = useApprovePremiumListing();
  const needsInfoMutation = useNeedsInfoPremiumListing();
  const rejectMutation = useRejectPremiumListing();
  const deleteMutation = useDeleteListing();

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success(`"${deleteTarget.name}" has been deleted`);
    } catch (error: any) {
      toast.error(`Failed to delete listing: ${error.message}`);
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleApprove = async (listingId: string, displayName: string) => {
    try {
      await approveMutation.mutateAsync({ 
        listingId, 
        notes: `Approved by admin on ${new Date().toLocaleDateString()}` 
      });
      
      // Track admin verification action
      trackAdminVerificationAction('approve', listingId);
      
      toast.success(`"${displayName}" has been approved and published`);
    } catch (error: any) {
      toast.error(`Failed to approve listing: ${error.message}`);
    }
  };

  const handleNeedsInfo = async (listingId: string, displayName: string) => {
    const notes = prompt("Please provide feedback for the partner:");
    if (!notes) return;

    try {
      await needsInfoMutation.mutateAsync({ listingId, notes });
      toast.success(`"${displayName}" marked as needs info`);
    } catch (error: any) {
      toast.error(`Failed to update listing: ${error.message}`);
    }
  };

  const handleReject = async (listingId: string, displayName: string) => {
    const reason = prompt("Please provide a reason for rejection:");
    if (!reason) return;

    try {
      await rejectMutation.mutateAsync({ listingId, reason });
      
      // Track admin verification action
      trackAdminVerificationAction('reject', listingId, reason);
      
      toast.success(`"${displayName}" has been rejected`);
    } catch (error: any) {
      toast.error(`Failed to reject listing: ${error.message}`);
    }
  };

  // Filter listings by search query (client-side filtering for now)
  const filteredListings = (listings || []).filter(listing => {
    const matchesSearch = !searchQuery || 
      listing.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.locality?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.city?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  // For now, since API returns array directly, we'll handle pagination client-side
  const totalCount = filteredListings.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const paginatedListings = filteredListings.slice((page - 1) * pageSize, page * pageSize);

  if (isLoading) {
    return <PageLoadingAnimation text="Loading premium listings..." />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Premium Listings Management</h1>
          <p className="text-muted-foreground">Manage and verify premium workspace listings</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-destructive">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>Failed to load premium listings</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="font-display text-2xl font-bold text-foreground">Premium Listings Management</h1>
        <p className="text-muted-premium">Manage and verify premium workspace listings</p>
      </div>

      {/* Filters */}
      <div className="card-premium animate-slide-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <Filter className="h-5 w-5 text-primary" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or locality..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 btn-premium"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="btn-premium">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="glass">
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </div>

      {/* Listings */}
      <div className="card-premium animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <CardHeader>
          <CardTitle className="font-display">
            Premium Workspace Listings ({totalCount})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paginatedListings.length === 0 ? (
            <div className="text-center py-8 text-muted-premium">
              <FileText className="h-8 w-8 mx-auto mb-2" />
              <p>No listings found</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block lg:hidden space-y-4">
                {paginatedListings.map((listing, index) => (
                  <div key={listing.listingId} className="card-premium p-4 space-y-3 animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-display font-semibold">{listing.displayName}</h4>
                        <p className="text-sm text-muted-premium">{listing.locality}, {listing.city}</p>
                      </div>
                      <StatusBadge status={listing.verificationStatus} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-premium font-medium">Capacity</p>
                        <p className="font-medium">{listing.seatCapacityMin}-{listing.seatCapacityMax} seats</p>
                      </div>
                      <div>
                        <p className="text-muted-premium font-medium">Budget</p>
                        <p className="font-medium">{listing.budgetDisplayText}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {(listing.workspaceTypes || []).map((type) => (
                        <Badge key={type} variant="secondary" className="text-xs">
                          {type.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="pt-2 border-t border-border/50">
                      <p className="text-xs text-muted-premium">
                        Created: {new Date(listing.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 btn-premium" asChild>
                        <Link to={`/admin/listings/${listing.listingId}`}>
                          <Eye className="h-4 w-4" />
                          View Details
                        </Link>
                      </Button>
                      
                      {(listing.verificationStatus === "PENDING_REVIEW" || 
                        listing.verificationStatus === "PENDING" || 
                        listing.verificationStatus === "SUBMITTED") && (
                        <>
                          <Button
                            onClick={() => handleApprove(listing.listingId, listing.displayName)}
                            disabled={approveMutation.isPending}
                            size="sm"
                            variant="success"
                            className="btn-premium"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleNeedsInfo(listing.listingId, listing.displayName)}
                            disabled={needsInfoMutation.isPending}
                            size="sm"
                            variant="outline"
                            className="btn-premium"
                          >
                            <AlertCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleReject(listing.listingId, listing.displayName)}
                            disabled={rejectMutation.isPending}
                            size="sm"
                            variant="destructive"
                            className="btn-premium"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block rounded-md border border-border/60 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="font-display font-semibold">Listing</TableHead>
                      <TableHead className="font-display font-semibold">Location</TableHead>
                      <TableHead className="font-display font-semibold">Capacity</TableHead>
                      <TableHead className="font-display font-semibold">Budget</TableHead>
                      <TableHead className="font-display font-semibold">Status</TableHead>
                      <TableHead className="font-display font-semibold">Created</TableHead>
                      <TableHead className="text-right font-display font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedListings.map((listing, index) => (
                      <TableRow key={listing.listingId} className="hover:bg-muted/30 transition-colors animate-fade-in" style={{ animationDelay: `${index * 0.02}s` }}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium font-display">{listing.displayName}</div>
                            <div className="flex flex-wrap gap-1">
                              {(listing.workspaceTypes || []).map((type) => (
                                <Badge key={type} variant="secondary" className="text-xs">
                                  {type.replace('_', ' ')}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{listing.locality}</div>
                            <div className="text-sm text-muted-premium">{listing.city}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {listing.seatCapacityMin}-{listing.seatCapacityMax} seats
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{listing.budgetDisplayText}</div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={listing.verificationStatus} />
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-premium">
                            {new Date(listing.createdAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 btn-premium">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="glass">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link to={`/admin/listings/${listing.listingId}`}>
                                  <Eye className="h-4 w-4" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {(listing.verificationStatus === "PENDING_REVIEW" || 
                                listing.verificationStatus === "PENDING" || 
                                listing.verificationStatus === "SUBMITTED") && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleApprove(listing.listingId, listing.displayName)}
                                    disabled={approveMutation.isPending}
                                  >
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleNeedsInfo(listing.listingId, listing.displayName)}
                                    disabled={needsInfoMutation.isPending}
                                  >
                                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                                    Needs Info
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleReject(listing.listingId, listing.displayName)}
                                    disabled={rejectMutation.isPending}
                                    className="text-destructive"
                                  >
                                    <XCircle className="h-4 w-4" />
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              )}
                              {listing.verificationStatus === "NEEDS_INFO" && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleApprove(listing.listingId, listing.displayName)}
                                    disabled={approveMutation.isPending}
                                  >
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleReject(listing.listingId, listing.displayName)}
                                    disabled={rejectMutation.isPending}
                                    className="text-destructive"
                                  >
                                    <XCircle className="h-4 w-4" />
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeleteTarget({ id: listing.listingId, name: listing.displayName })}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete Listing
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="card-premium animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-premium">
                Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} listings
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                  className="btn-premium"
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                    if (pageNum > totalPages) return null;
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                        className="btn-premium w-8"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                  className="btn-premium"
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Listing</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete <span className="font-semibold text-foreground">"{deleteTarget?.name}"</span>? This action cannot be undone and will remove the listing from the platform entirely.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Listing"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}