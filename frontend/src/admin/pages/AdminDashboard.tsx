import { Link } from "react-router-dom";
import { Building2, Users, Calendar, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockAdminListings, mockLeads, mockVisits, getLeadCountsByStatus } from "@/admin/mockData";

export function AdminDashboard() {
  const leadCounts = getLeadCountsByStatus();
  const pendingListings = mockAdminListings.filter((l) => l.adminStatus === "pending").length;
  const approvedListings = mockAdminListings.filter((l) => l.adminStatus === "approved").length;
  const pendingVisits = mockVisits.filter((v) => v.status === "pending").length;
  const urgentLeads = mockLeads.filter((l) => l.isUrgent).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your workspace operations</p>
      </div>

      {/* Urgent Alerts */}
      {(urgentLeads > 0 || pendingVisits > 0) && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Needs Attention</span>
          </div>
          <div className="mt-2 space-y-1 text-sm">
            {urgentLeads > 0 && (
              <p>{urgentLeads} urgent lead{urgentLeads > 1 ? "s" : ""} requiring immediate response</p>
            )}
            {pendingVisits > 0 && (
              <p>{pendingVisits} visit{pendingVisits > 1 ? "s" : ""} pending confirmation</p>
            )}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/admin/listings">
          <Card className="hover:border-primary/30 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Listings</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockAdminListings.length}</div>
              <p className="text-xs text-muted-foreground">
                {approvedListings} approved, {pendingListings} pending
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/leads">
          <Card className="hover:border-primary/30 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockLeads.length}</div>
              <p className="text-xs text-muted-foreground">
                {leadCounts.new} new today
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/visits">
          <Card className="hover:border-primary/30 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Scheduled Visits</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockVisits.length}</div>
              <p className="text-xs text-muted-foreground">
                {pendingVisits} need confirmation
              </p>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24%</div>
            <p className="text-xs text-muted-foreground">Lead to visit</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Leads */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Leads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockLeads.slice(0, 5).map((lead) => (
              <div key={lead.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium text-foreground">{lead.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {lead.teamSizeBand} people • {lead.budgetBand}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {lead.isUrgent && (
                    <span className="h-2 w-2 rounded-full bg-destructive" />
                  )}
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    lead.status === "new" ? "bg-primary/10 text-primary" :
                    lead.status === "booked" ? "bg-success/10 text-success" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {lead.status.replace("_", " ")}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Pending Verifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pending Verifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockAdminListings.filter((l) => l.adminStatus === "pending").slice(0, 5).map((listing) => (
              <Link
                key={listing.slug}
                to={`/admin/listings/${listing.slug}`}
                className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0 hover:bg-muted/50 -mx-2 px-2 py-1 rounded-lg transition-colors"
              >
                <div>
                  <p className="font-medium text-foreground">{listing.displayName}</p>
                  <p className="text-xs text-muted-foreground">{listing.locality}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent-foreground">
                  Pending Review
                </span>
              </Link>
            ))}
            {mockAdminListings.filter((l) => l.adminStatus === "pending").length === 0 && (
              <div className="flex items-center gap-2 text-muted-foreground py-4">
                <CheckCircle className="h-5 w-5 text-success" />
                All listings verified
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
