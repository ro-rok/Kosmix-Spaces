import { Link } from "react-router-dom";
import { Building2, Calendar, TrendingUp, AlertCircle, CheckCircle, Eye, MessageSquare, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminPartners, useAdminAnalytics } from "@/hooks/useAuth";

export function AdminDashboard() {
  // Fetch real data
  const { data: partnersData } = useAdminPartners();
  const { data: analytics } = useAdminAnalytics();
  
  const totalPartners = partnersData?.total || 0;
  const pendingPartners = partnersData?.items.filter(p => p.status === "PENDING").length || 0;
  const activePartners = partnersData?.items.filter(p => p.status === "ACTIVE").length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your workspace operations</p>
      </div>

      {/* Urgent Alerts */}
      {(pendingPartners > 0) && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Needs Attention</span>
          </div>
          <div className="mt-2 space-y-1 text-sm">
            {pendingPartners > 0 && (
              <p>{pendingPartners} partner{pendingPartners > 1 ? "s" : ""} awaiting approval</p>
            )}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Link to="/admin/partners">
          <Card className="hover:border-primary/30 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Partners</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPartners}</div>
              <p className="text-xs text-muted-foreground">
                {activePartners} active, {pendingPartners} pending
              </p>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalViews || 0}</div>
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
            <div className="text-2xl font-bold">{analytics?.totalEnquiries || 0}</div>
            <p className="text-xs text-muted-foreground">
              Customer enquiries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Searches</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalSearches || 0}</div>
            <p className="text-xs text-muted-foreground">
              Search queries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.conversionRate ? `${analytics.conversionRate.toFixed(1)}%` : '0%'}</div>
            <p className="text-xs text-muted-foreground">Views to enquiries</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Partners */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Partner Registrations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {partnersData?.items.length ? (
              <div className="space-y-3">
                {partnersData.items.slice(0, 5).map((partner) => (
                  <div key={partner.partnerId} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-foreground">{partner.workspaceBrandName}</p>
                      <p className="text-xs text-muted-foreground">
                        {partner.contactName} • {partner.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        partner.status === "ACTIVE" ? "bg-green-100 text-green-800" :
                        partner.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {partner.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <p>No partners registered yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingPartners > 0 ? (
              <div className="space-y-3">
                {partnersData?.items.filter(p => p.status === "PENDING").slice(0, 5).map((partner) => (
                  <div key={partner.partnerId} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-foreground">{partner.workspaceBrandName}</p>
                      <p className="text-xs text-muted-foreground">{partner.contactName}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                      Pending Review
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground py-4">
                <CheckCircle className="h-5 w-5 text-success" />
                All partners reviewed
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Performing Listings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Performing Listings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analytics?.topListings && analytics.topListings.length > 0 ? (
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
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <p>No listing performance data yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Localities */}
      {analytics?.topLocalities && analytics.topLocalities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Most Popular Localities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {analytics.topLocalities.slice(0, 6).map((locality: any) => (
                <div key={locality.locality} className="p-4 border border-border rounded-lg">
                  <h3 className="font-medium text-foreground">{locality.locality}</h3>
                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <p>{locality.searches} searches</p>
                    <p>{locality.views} views</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
