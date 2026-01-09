import { Link } from "react-router-dom";
import { Plus, FileText, Clock, AlertCircle, CheckCircle, XCircle, Shield, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePartnerMe, useCreatePartnerListing } from "@/hooks/useAuth";
import { VerificationStatus } from "@/types/models";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function PartnerDashboard() {
  const { data: partner, isLoading, error } = usePartnerMe();
  const createListingMutation = useCreatePartnerListing();

  const testApiCall = async () => {
    try {
      // Use the exact same format as the form submission
      const testData = {
        displayName: "Test Workspace",
        brandHidden: false,
        locality: "Connaught Place",
        workspaceTypes: ["DEDICATED_DESKS"],
        seatCapacityMin: 1,
        seatCapacityMax: 10,
        availabilityStatus: "AVAILABLE",
        budgetBandId: "10k-20k",
        budgetDisplayText: "Contact for pricing",
        nearMetro: false,
        metroNote: null,
        parking: "NONE",
        powerBackup: false,
        gstInvoiceAvailable: false,
        accessHours: "9 AM - 9 PM",
        weekendAccess: false,
        amenities: ["High-speed WiFi"],
        meetingRoomsCount: null,
        meetingRoomsAddonOnly: true,
        internetSpeedMbps: null,
        dealTags: [],
        dealDetails: null,
        dealEligibility: null,
        overview: "This is a test workspace overview with more than 10 characters",
        houseRules: null,
      };

      console.log("Test data:", JSON.stringify(testData, null, 2));
      const result = await createListingMutation.mutateAsync(testData);
      console.log("Test result:", result);
      toast.success("Test API call successful!");
    } catch (error: any) {
      console.error("Test API call failed:", error);
      toast.error(`Test failed: ${error.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !partner) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-destructive">Error loading partner data</p>
        </div>
      </div>
    );
  }

  // Check if partner is approved
  const isApproved = partner.status === "ACTIVE";
  const isPending = partner.status === "PENDING";
  const isSuspended = partner.status === "SUSPENDED";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {partner.workspaceBrandName}</p>
      </div>

      {/* Account Status Alert */}
      {!isApproved && (
        <Card className={cn(
          "border-2",
          isPending && "border-yellow-200 bg-yellow-50",
          isSuspended && "border-red-200 bg-red-50"
        )}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className={cn(
                "h-5 w-5",
                isPending && "text-yellow-600",
                isSuspended && "text-red-600"
              )} />
              <CardTitle className={cn(
                isPending && "text-yellow-800",
                isSuspended && "text-red-800"
              )}>
                Account Status: {partner.status}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {isPending && (
              <div>
                <p className="text-yellow-800 mb-2">
                  Your partner account is pending approval from our admin team.
                </p>
                <p className="text-sm text-yellow-700">
                  You will not be able to submit listings until your account is approved. 
                  We'll notify you once the review is complete.
                </p>
              </div>
            )}
            {isSuspended && (
              <div>
                <p className="text-red-800 mb-2">
                  Your partner account has been suspended.
                </p>
                <p className="text-sm text-red-700">
                  Please contact our support team for more information.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Profile Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Partner Profile</CardTitle>
          <CardDescription>Your workspace information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <p className="text-sm text-muted-foreground">Workspace Name</p>
            <p className="font-medium">{partner.workspaceBrandName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Contact Name</p>
            <p className="font-medium">{partner.contactName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{partner.email}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Phone</p>
            <p className="font-medium">{partner.phone}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Account Status</p>
            <div className="flex items-center gap-2">
              {partner.status === "ACTIVE" && <CheckCircle className="h-4 w-4 text-green-600" />}
              {partner.status === "PENDING" && <Clock className="h-4 w-4 text-yellow-600" />}
              {partner.status === "SUSPENDED" && <XCircle className="h-4 w-4 text-red-600" />}
              <span className={cn(
                "font-medium",
                partner.status === "ACTIVE" && "text-green-600",
                partner.status === "PENDING" && "text-yellow-600",
                partner.status === "SUSPENDED" && "text-red-600"
              )}>
                {partner.status}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <Button 
          asChild 
          size="lg" 
          className="flex-1"
          disabled={!isApproved}
        >
          <Link to={isApproved ? "/partner/listings/new" : "#"}>
            <Plus className="h-5 w-5" />
            Submit a New Workspace
          </Link>
        </Button>
        <Button 
          asChild 
          variant="outline" 
          size="lg" 
          className="flex-1"
          disabled={!isApproved}
        >
          <Link to={isApproved ? "/partner/listings" : "#"}>
            <FileText className="h-5 w-5" />
            View My Submissions
          </Link>
        </Button>
      </div>

      {/* Debug Test Button */}
      {isApproved && (
        <Card>
          <CardHeader>
            <CardTitle>Debug Tools</CardTitle>
            <CardDescription>Test API functionality</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testApiCall}
              disabled={createListingMutation.isPending}
              variant="outline"
            >
              <Bug className="h-4 w-4" />
              {createListingMutation.isPending ? "Testing..." : "Test API Call"}
            </Button>
          </CardContent>
        </Card>
      )}

      {!isApproved && (
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>What happens next?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                1
              </div>
              <div>
                <p className="font-medium">Account Review</p>
                <p className="text-sm text-muted-foreground">
                  Our admin team will review your partner application
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-bold">
                2
              </div>
              <div>
                <p className="font-medium">Account Approval</p>
                <p className="text-sm text-muted-foreground">
                  Once approved, you'll be able to submit workspace listings
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-bold">
                3
              </div>
              <div>
                <p className="font-medium">Start Listing</p>
                <p className="text-sm text-muted-foreground">
                  Submit your workspace details for verification and publishing
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
