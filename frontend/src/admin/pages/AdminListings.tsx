import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Eye, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Clock,
  Filter,
  Search,
  MoreHorizontal,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
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
import { useAdminListings, useApproveListing, useNeedsInfoListing, useRejectListing } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const statusOptions = [
  { value: "all", label: "All Statuses" },
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

  const { data: listings, isLoading, error } = useAdminListings({
    status: statusFilter === "all" ? undefined : statusFilter,
    page,
    pageSize,
  });

  const approveMutation = useApproveListing();
  const needsInfoMutation = useNeedsInfoListing();
  const rejectMutation = useRejectListing();

  const handleApprove = async (listingId: string, displayName: string) => {
    try {
      await approveMutation.mutateAsync({ 
        listingId, 
        notes: `Approved by admin on ${new Date().toLocaleDateString()}` 
      });
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
      toast.success(`"${displayName}" has been rejected`);
    } catch (error: any) {
      toast.error(`Failed to reject listing: ${error.message}`);
    }
  };

  // Filter listings by search query
  const filteredListings = listings?.filter(listing =>
    listing.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    listing.locality.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Listings Management</h1>
          <p className="text-muted-foreground">Manage and verify workspace listings</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading listings...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Listings Management</h1>
          <p className="text-muted-foreground">Manage and verify workspace listings</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-destructive">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>Failed to load listings</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Listings Management</h1>
        <p className="text-muted-foreground">Manage and verify workspace listings</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
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
                  className="pl-9"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
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
      </Card>

      {/* Listings Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Workspace Listings ({filteredListings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredListings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2" />
              <p>No listings found</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Listing</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredListings.map((listing) => (
                    <TableRow key={listing.listingId}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{listing.displayName}</div>
                          <div className="flex flex-wrap gap-1">
                            {listing.workspaceTypes.map((type) => (
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
                          <div className="text-sm text-muted-foreground">{listing.city}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {listing.seatCapacityMin}-{listing.seatCapacityMax} seats
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{listing.budgetDisplayText}</div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={listing.verificationStatus} />
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {new Date(listing.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link to={`/admin/listings/${listing.listingId}`}>
                                <Eye className="h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {listing.verificationStatus === "PENDING_REVIEW" && (
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
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}