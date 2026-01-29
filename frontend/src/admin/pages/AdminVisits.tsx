import { useState } from "react";
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Calendar, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  MapPin,
  Building2,
  User,
  Phone,
  Mail,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { VisitStatus } from "@/types/models";
import { Link } from "react-router-dom";

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "REQUESTED", label: "Requested" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

function getStatusBadge(status: VisitStatus) {
  switch (status) {
    case "REQUESTED":
      return <Badge className="bg-blue-100 text-blue-800">Requested</Badge>;
    case "CONFIRMED":
      return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>;
    case "COMPLETED":
      return <Badge className="bg-purple-100 text-purple-800">Completed</Badge>;
    case "CANCELLED":
      return <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function getStatusIcon(status: VisitStatus) {
  switch (status) {
    case "REQUESTED":
      return <AlertCircle className="h-4 w-4 text-blue-600" />;
    case "CONFIRMED":
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case "COMPLETED":
      return <CheckCircle className="h-4 w-4 text-purple-600" />;
    case "CANCELLED":
      return <XCircle className="h-4 w-4 text-gray-600" />;
    default:
      return null;
  }
}

interface Visit {
  visitRequestId: string;
  leadId: string;
  listingIds: string[];
  preferredSlots: Array<{
    date: string;
    timeWindow: string;
  }>;
  visitorCount: number;
  status: VisitStatus;
  confirmedSlot?: {
    date: string;
    timeSlot: string;
  };
  opsOwner?: string;
  partnerNotes?: string;
  customerNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export function AdminVisits() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [updateDialog, setUpdateDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<VisitStatus>("REQUESTED");
  const [confirmedDate, setConfirmedDate] = useState("");
  const [confirmedTimeSlot, setConfirmedTimeSlot] = useState("");
  const [opsOwner, setOpsOwner] = useState("");
  const [partnerNotes, setPartnerNotes] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const pageSize = 20;

  const queryClient = useQueryClient();

  // Fetch visits with filters
  const { data: visits, isLoading, error } = useQuery({
    queryKey: ["admin", "visits", { status: statusFilter === "all" ? undefined : statusFilter, page, pageSize }],
    queryFn: () => api.admin.getSiteVisits({
      status: statusFilter === "all" ? undefined : statusFilter as VisitStatus,
      page,
      pageSize,
    }),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Update visit mutation
  const updateVisitMutation = useMutation({
    mutationFn: ({ visitId, data }: {
      visitId: string;
      data: {
        status?: VisitStatus;
        confirmedSlot?: {
          date: string;
          timeSlot: string;
        };
        opsOwner?: string;
        partnerNotes?: string;
        customerNotes?: string;
      };
    }) => api.admin.updateSiteVisit(visitId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "visits"] });
      toast.success("Visit updated successfully");
      setUpdateDialog(false);
      setSelectedVisit(null);
      // Reset form
      setConfirmedDate("");
      setConfirmedTimeSlot("");
      setOpsOwner("");
      setPartnerNotes("");
      setCustomerNotes("");
    },
    onError: (error: any) => {
      toast.error(`Failed to update visit: ${error.message}`);
    },
  });

  const handleUpdateVisit = () => {
    if (!selectedVisit) return;

    const updateData: any = {
      status: newStatus,
    };

    if (confirmedDate && confirmedTimeSlot) {
      updateData.confirmedSlot = {
        date: confirmedDate,
        timeSlot: confirmedTimeSlot,
      };
    }

    if (opsOwner) {
      updateData.opsOwner = opsOwner;
    }

    if (partnerNotes) {
      updateData.partnerNotes = partnerNotes;
    }

    if (customerNotes) {
      updateData.customerNotes = customerNotes;
    }

    updateVisitMutation.mutate({
      visitId: selectedVisit.visitRequestId,
      data: updateData,
    });
  };

  const openUpdateDialog = (visit: Visit) => {
    setSelectedVisit(visit);
    setNewStatus(visit.status);
    setConfirmedDate(visit.confirmedSlot?.date || "");
    setConfirmedTimeSlot(visit.confirmedSlot?.timeSlot || "");
    setOpsOwner(visit.opsOwner || "");
    setPartnerNotes(visit.partnerNotes || "");
    setCustomerNotes(visit.customerNotes || "");
    setUpdateDialog(true);
  };

  // Filter visits by search query
  const filteredVisits = visits?.filter(visit =>
    visit.visitRequestId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    visit.leadId.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Calculate statistics
  const totalVisits = visits?.length || 0;
  const requestedVisits = visits?.filter(v => v.status === "REQUESTED").length || 0;
  const confirmedVisits = visits?.filter(v => v.status === "CONFIRMED").length || 0;
  const completedVisits = visits?.filter(v => v.status === "COMPLETED").length || 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Visits Management</h1>
          <p className="text-muted-foreground">Manage site visit requests and scheduling</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">Loading visits...</p>
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
          <h1 className="font-display text-2xl font-bold text-foreground">Visits Management</h1>
          <p className="text-muted-foreground">Manage site visit requests and scheduling</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-destructive">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>Failed to load visits: {error.message}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Visits Management</h1>
        <p className="text-muted-foreground">Manage site visit requests and scheduling</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Visits</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVisits}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Requested</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requestedVisits}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Confirmed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{confirmedVisits}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedVisits}</div>
          </CardContent>
        </Card>
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
                  placeholder="Search by visit ID or lead ID..."
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

      {/* Visits Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Site Visits ({filteredVisits.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredVisits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-2" />
              <p>No visits found</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Visit ID</TableHead>
                    <TableHead>Lead</TableHead>
                    <TableHead>Listings</TableHead>
                    <TableHead>Preferred Slots</TableHead>
                    <TableHead>Visitors</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Confirmed Slot</TableHead>
                    <TableHead>Ops Owner</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVisits.map((visit) => (
                    <TableRow key={visit.visitRequestId}>
                      <TableCell>
                        <div className="font-mono text-xs">
                          {visit.visitRequestId.substring(0, 8)}...
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link 
                          to={`/admin/leads`}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          {visit.leadId.substring(0, 8)}...
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {visit.listingIds.slice(0, 2).map((listingId) => (
                            <Badge key={listingId} variant="outline" className="text-xs">
                              <Building2 className="h-3 w-3 mr-1" />
                              {listingId.substring(0, 6)}...
                            </Badge>
                          ))}
                          {visit.listingIds.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{visit.listingIds.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          {visit.preferredSlots.slice(0, 2).map((slot, idx) => (
                            <div key={idx} className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span>{new Date(slot.date).toLocaleDateString()}</span>
                              <span className="text-muted-foreground">({slot.timeWindow})</span>
                            </div>
                          ))}
                          {visit.preferredSlots.length > 2 && (
                            <div className="text-xs text-muted-foreground">
                              +{visit.preferredSlots.length - 2} more
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{visit.visitorCount}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(visit.status)}
                          {getStatusBadge(visit.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {visit.confirmedSlot ? (
                          <div className="text-sm">
                            <div>{new Date(visit.confirmedSlot.date).toLocaleDateString()}</div>
                            <div className="text-muted-foreground">{visit.confirmedSlot.timeSlot}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Not confirmed</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {visit.opsOwner || "Unassigned"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {new Date(visit.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => openUpdateDialog(visit)}>
                              Update Visit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link to={`/admin/leads`}>
                                View Lead
                              </Link>
                            </DropdownMenuItem>
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

      {/* Update Visit Dialog */}
      <Dialog open={updateDialog} onOpenChange={setUpdateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Update Site Visit</DialogTitle>
            <DialogDescription>
              Update visit status, confirmed slot, and notes
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={newStatus} onValueChange={(value) => setNewStatus(value as VisitStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REQUESTED">Requested</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="confirmedDate">Confirmed Date</Label>
                <Input
                  id="confirmedDate"
                  type="date"
                  value={confirmedDate}
                  onChange={(e) => setConfirmedDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmedTimeSlot">Time Slot</Label>
                <Input
                  id="confirmedTimeSlot"
                  placeholder="e.g., 10:00-11:00"
                  value={confirmedTimeSlot}
                  onChange={(e) => setConfirmedTimeSlot(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="opsOwner">Ops Owner</Label>
              <Input
                id="opsOwner"
                placeholder="Assign ops team member"
                value={opsOwner}
                onChange={(e) => setOpsOwner(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="partnerNotes">Partner Notes</Label>
              <Textarea
                id="partnerNotes"
                placeholder="Internal notes for partners..."
                value={partnerNotes}
                onChange={(e) => setPartnerNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerNotes">Customer Notes</Label>
              <Textarea
                id="customerNotes"
                placeholder="Notes visible to customer..."
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUpdateDialog(false);
                setSelectedVisit(null);
              }}
              disabled={updateVisitMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateVisit}
              disabled={updateVisitMutation.isPending}
            >
              {updateVisitMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                "Update Visit"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
