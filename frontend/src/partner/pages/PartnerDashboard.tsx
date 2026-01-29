import { Link } from "react-router-dom";
import { Plus, FileText, Clock, CheckCircle, XCircle, Shield, Eye, MessageSquare, TrendingUp, BarChart3, User, Mail, Phone, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePartnerMe, usePartnerListingsStats, usePartnerAnalytics } from "@/hooks/useAuth";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export function PartnerDashboard() {
  const { user } = useAuth();
  const { data: partner, isLoading, error } = usePartnerMe();
  const { data: listingsStats } = usePartnerListingsStats();
  const { data: analytics } = usePartnerAnalytics(partner?.partnerId || "");

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

      {/* Partner Profile - Prominent Display */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">Partner Profile</CardTitle>
              <CardDescription>Your workspace account information</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {partner.status === "ACTIVE" && <CheckCircle className="h-5 w-5 text-green-600" />}
              {partner.status === "PENDING" && <Clock className="h-5 w-5 text-yellow-600" />}
              {partner.status === "SUSPENDED" && <XCircle className="h-5 w-5 text-red-600" />}
              <span className={cn(
                "font-semibold text-sm",
                partner.status === "ACTIVE" && "text-green-600",
                partner.status === "PENDING" && "text-yellow-600",
                partner.status === "SUSPENDED" && "text-red-600"
              )}>
                {partner.status}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>Workspace Name</span>
              </div>
              <p className="font-semibold text-foreground">{partner.workspaceBrandName}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Contact Name</span>
              </div>
              <p className="font-semibold text-foreground">{partner.contactName}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>Email</span>
              </div>
              <p className="font-semibold text-foreground break-all">{partner.email}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>Phone</span>
              </div>
              <p className="font-semibold text-foreground">{partner.phone}</p>
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

      {/* Analytics Cards - Only show for approved partners */}
      {isApproved && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Listings</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{listingsStats?.totalListings || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {listingsStats?.approved || 0} approved, {listingsStats?.pendingReview || 0} pending
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.views || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Listing page views
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Enquiries</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.enquiries || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Customer enquiries
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics?.conversionRate ? `${analytics.conversionRate.toFixed(1)}%` : '0%'}
                </div>
                <p className="text-xs text-muted-foreground">Views to enquiries</p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Insights */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top Performing Listings */}
            {analytics?.topListings && analytics.topListings.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top Performing Listings</CardTitle>
                  <CardDescription>Your most viewed and enquired listings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-3">
                    {analytics.topListings.slice(0, 5).map((listing: any) => (
                      <div key={listing.listingId} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                        <div>
                          <p className="font-medium text-foreground">{listing.displayName}</p>
                          <p className="text-xs text-muted-foreground">
                            {listing.views} views • {listing.enquiries} enquiries
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {listing.views > 0 ? ((listing.enquiries / listing.views) * 100).toFixed(1) : 0}%
                          </p>
                          <p className="text-xs text-muted-foreground">conversion</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance Insights</CardTitle>
                  <CardDescription>Analytics will appear once your listings receive views</CardDescription>
                </CardHeader>
                <CardContent className="py-8">
                  <div className="text-center text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No performance data yet</p>
                    <p className="text-xs mt-1">Submit and publish listings to start tracking performance</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Listing Status Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Listing Status Overview</CardTitle>
                <CardDescription>Current status of your submissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Approved</span>
                  </div>
                  <span className="font-medium">{listingsStats?.approved || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm">Pending Review</span>
                  </div>
                  <span className="font-medium">{listingsStats?.pendingReview || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm">Rejected</span>
                  </div>
                  <span className="font-medium">{listingsStats?.rejected || 0}</span>
                </div>
                {(listingsStats?.totalListings || 0) === 0 && (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">No listings submitted yet</p>
                    <Button asChild size="sm" className="mt-2">
                      <Link to="/partner/listings/new">
                        <Plus className="h-4 w-4 mr-2" />
                        Submit Your First Listing
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
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
