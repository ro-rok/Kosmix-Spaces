import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, CheckCircle, XCircle, AlertCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockAdminListings } from "@/admin/mockData";
import { budgetBandLabels, workspaceTypeLabels } from "@/data/listings";
import { localities } from "@/data/localities";
import { cn } from "@/lib/utils";

export function AdminListings() {
  const [search, setSearch] = useState("");
  const [localityFilter, setLocalityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredListings = mockAdminListings.filter((listing) => {
    const matchesSearch = listing.displayName.toLowerCase().includes(search.toLowerCase()) ||
      listing.locality.toLowerCase().includes(search.toLowerCase());
    const matchesLocality = localityFilter === "all" || listing.localityId === localityFilter;
    const matchesStatus = statusFilter === "all" || listing.adminStatus === statusFilter;
    return matchesSearch && matchesLocality && matchesStatus;
  });

  const statusColors = {
    pending: "bg-accent/20 text-accent-foreground",
    approved: "bg-success/10 text-success",
    rejected: "bg-destructive/10 text-destructive",
    suspended: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Listings</h1>
        <p className="text-muted-foreground">Manage and verify workspace listings</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search listings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={localityFilter} onValueChange={setLocalityFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Localities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Localities</SelectItem>
            {localities.map((loc) => (
              <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Listing</TableHead>
                <TableHead className="hidden sm:table-cell">Locality</TableHead>
                <TableHead className="hidden md:table-cell">Types</TableHead>
                <TableHead className="hidden lg:table-cell">Budget</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredListings.map((listing) => (
                <TableRow key={listing.slug}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img
                        src={listing.photos[0]}
                        alt=""
                        className="h-10 w-14 rounded object-cover hidden sm:block"
                      />
                      <div>
                        <p className="font-medium line-clamp-1">{listing.displayName}</p>
                        <p className="text-xs text-muted-foreground sm:hidden">{listing.locality}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{listing.locality}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {listing.workspaceTypes.slice(0, 2).map((type) => (
                        <span key={type} className="text-xs bg-muted px-2 py-0.5 rounded">
                          {workspaceTypeLabels[type].split(" ")[0]}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {budgetBandLabels[listing.budgetBand]}
                  </TableCell>
                  <TableCell>
                    <span className={cn("text-xs px-2 py-1 rounded-full capitalize", statusColors[listing.adminStatus])}>
                      {listing.adminStatus}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                    {new Date(listing.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/admin/listings/${listing.slug}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      {listing.adminStatus === "pending" && (
                        <>
                          <Button variant="ghost" size="icon" className="text-success hover:text-success">
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {filteredListings.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No listings match your filters
        </div>
      )}
    </div>
  );
}
