import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/lib/api";
import { InlineLoadingAnimation } from "@/components/LoadingAnimation";
import { cn } from "@/lib/utils";
import { 
  Search, 
  Filter, 
  Check, 
  X, 
  Clock, 
  MapPin, 
  Users, 
  Eye,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle
} from "lucide-react";
import { toast } from "sonner";

interface Locality {
  id: string;
  name: string;
  cityId: string;
  cityName: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  popular: boolean;
  metroConnected: boolean;
  addedBy?: string;
  addedByType: string;
  listingCount: number;
  enquiryCount: number;
  createdAt: string;
  rejectionReason?: string;
}

interface LocalityStats {
  totalCount: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
}

export default function AdminLocalities() {
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [stats, setStats] = useState<LocalityStats>({
    totalCount: 0,
    approvedCount: 0,
    pendingCount: 0,
    rejectedCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("PENDING");
  const [selectedLocality, setSelectedLocality] = useState<Locality | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalAction, setApprovalAction] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [rejectionReason, setRejectionReason] = useState("");
  const [markAsPopular, setMarkAsPopular] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const cities = [
    { id: "delhi", name: "Delhi" },
    { id: "gurugram", name: "Gurugram" },
    { id: "noida", name: "Noida" }
  ];

  const fetchLocalities = async () => {
    try {
      setLoading(true);
      const response = await api.admin.getLocalities({
        query: searchQuery || undefined,
        cityId: selectedCity || undefined,
        status: selectedStatus || undefined,
        page: 1,
        pageSize: 100
      });

      setLocalities(response.localities);
      setStats({
        totalCount: response.totalCount,
        approvedCount: response.approvedCount,
        pendingCount: response.pendingCount,
        rejectedCount: response.rejectedCount
      });
    } catch (error) {
      console.error("Failed to fetch localities:", error);
      toast.error("Failed to load localities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocalities();
  }, [searchQuery, selectedCity, selectedStatus]);

  const handleApprovalAction = (locality: Locality, action: "APPROVE" | "REJECT") => {
    setSelectedLocality(locality);
    setApprovalAction(action);
    setRejectionReason("");
    setMarkAsPopular(false);
    setShowApprovalDialog(true);
  };

  const submitApproval = async () => {
    if (!selectedLocality) return;

    if (approvalAction === "REJECT" && !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    try {
      setSubmitting(true);
      
      await api.admin.approveLocality(selectedLocality.id, {
        action: approvalAction,
        rejectionReason: approvalAction === "REJECT" ? rejectionReason : undefined,
        popular: approvalAction === "APPROVE" ? markAsPopular : false
      });

      toast.success(
        approvalAction === "APPROVE" 
          ? "Locality approved successfully" 
          : "Locality rejected successfully"
      );

      setShowApprovalDialog(false);
      setSelectedLocality(null);
      fetchLocalities();
    } catch (error: any) {
      console.error("Failed to update locality:", error);
      toast.error(error.message || "Failed to update locality");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case "REJECTED":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case "PENDING":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAddedByBadge = (addedByType: string) => {
    switch (addedByType) {
      case "SYSTEM":
        return <Badge variant="outline" className="text-xs">System</Badge>;
      case "PARTNER":
        return <Badge variant="secondary" className="text-xs">Partner</Badge>;
      case "ADMIN":
        return <Badge variant="default" className="text-xs">Admin</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{addedByType}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Locality Management</h1>
        <p className="text-muted-foreground">
          Manage localities submitted by partners and system defaults
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Localities</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approvedCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejectedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Localities</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by locality name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger>
                  <SelectValue placeholder="All cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All cities</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={city.id}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Localities List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Localities</CardTitle>
          <CardDescription>
            {loading ? "Loading localities..." : `${localities.length} localities found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <InlineLoadingAnimation 
              isLoading={loading}
              text="Loading localities..."
              size="md"
            />
          ) : localities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No localities found matching your criteria
            </div>
          ) : (
            <div className="space-y-4">
              {localities.map((locality) => (
                <div
                  key={locality.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{locality.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {locality.cityName}
                      </Badge>
                      {locality.popular && (
                        <Badge variant="default" className="text-xs bg-blue-100 text-blue-800">
                          Popular
                        </Badge>
                      )}
                      {locality.metroConnected && (
                        <Badge variant="outline" className="text-xs">
                          Metro
                        </Badge>
                      )}
                      {getAddedByBadge(locality.addedByType)}
                      {getStatusBadge(locality.status)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {locality.listingCount} listings
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {locality.enquiryCount} enquiries
                      </span>
                      <span>
                        Added {new Date(locality.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {locality.status === "REJECTED" && locality.rejectionReason && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                        <strong>Rejection reason:</strong> {locality.rejectionReason}
                      </div>
                    )}
                  </div>
                  
                  {locality.status === "PENDING" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApprovalAction(locality, "APPROVE")}
                        className="text-green-600 border-green-600 hover:bg-green-50"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApprovalAction(locality, "REJECT")}
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalAction === "APPROVE" ? "Approve" : "Reject"} Locality
            </DialogTitle>
            <DialogDescription>
              {approvalAction === "APPROVE" 
                ? `Approve "${selectedLocality?.name}" in ${selectedLocality?.cityName}?`
                : `Reject "${selectedLocality?.name}" in ${selectedLocality?.cityName}?`
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {approvalAction === "APPROVE" && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="popular"
                  checked={markAsPopular}
                  onCheckedChange={setMarkAsPopular}
                />
                <Label htmlFor="popular">Mark as popular locality</Label>
              </div>
            )}
            
            {approvalAction === "REJECT" && (
              <div className="space-y-2">
                <Label htmlFor="rejectionReason">Rejection Reason *</Label>
                <Textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejecting this locality..."
                  rows={3}
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApprovalDialog(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={submitApproval}
              disabled={submitting || (approvalAction === "REJECT" && !rejectionReason.trim())}
              className={cn(
                approvalAction === "APPROVE" 
                  ? "bg-green-600 hover:bg-green-700" 
                  : "bg-red-600 hover:bg-red-700"
              )}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : approvalAction === "APPROVE" ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <X className="h-4 w-4 mr-2" />
              )}
              {submitting ? "Processing..." : approvalAction === "APPROVE" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}