import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, MessageCircle, TrendingUp, Phone, ArrowUp, ArrowDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePartnerListings, usePartnerMe } from "@/hooks/useAuth";

export function PartnerAnalytics() {
  const { user } = useAuth();
  const { data: partner } = usePartnerMe();
  // Use partner.partnerId instead of user.id - this matches PartnerDashboard
  const partnerId = partner?.partnerId || user?.id;
  
  const [dateRange, setDateRange] = useState("30"); // days
  const [granularity, setGranularity] = useState<"day" | "week" | "month">("day");
  const [selectedListingId, setSelectedListingId] = useState<string>("all");

  const startDate = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString();
  const endDate = new Date().toISOString();

  // Get partner's listings for selector
  const { data: listingsData } = usePartnerListings();
  const listings = listingsData || [];

  const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = useQuery({
    queryKey: ["partner-analytics", partnerId, dateRange, selectedListingId],
    queryFn: () => api.analytics.getPartnerAnalytics(partnerId || "", {
      startDate,
      endDate,
      listingId: selectedListingId !== "all" ? selectedListingId : undefined
    }),
    enabled: !!partnerId,
    retry: false
  });

  const { data: timeSeries, isLoading: timeSeriesLoading, error: timeSeriesError } = useQuery({
    queryKey: ["partner-time-series", partnerId, dateRange, granularity],
    queryFn: () => api.analytics.getTimeSeries({
      startDate,
      endDate,
      partnerId: partnerId,
      granularity
    }),
    enabled: !!partnerId,
    retry: false
  });

  if (!partnerId) {
    return (
      <div className="container py-8">
        <p className="text-muted-foreground">Please log in to view analytics</p>
      </div>
    );
  }

  if (analyticsLoading || timeSeriesLoading) {
    return (
      <div className="container py-8 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (analyticsError || timeSeriesError) {
    console.error("Analytics error:", analyticsError || timeSeriesError);
    return (
      <div className="container py-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Your Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Performance metrics for your listings
          </p>
        </div>
        <Card>
          <CardContent className="py-8">
            <p className="text-destructive">
              {analyticsError ? `Error loading analytics: ${(analyticsError as any)?.message || 'Unknown error'}` : 
               timeSeriesError ? `Error loading time series: ${(timeSeriesError as any)?.message || 'Unknown error'}` : 
               'Failed to load analytics data'}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Please try refreshing the page or contact support if the issue persists.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Debug logging
  console.log("Partner Analytics Debug:", {
    partnerId,
    user: user,
    partner: partner,
    analytics,
    timeSeries,
    listingsCount: listings.length,
    listings: listings.map(l => ({ id: l.listingId, slug: l.slug }))
  });
  
  // Debug: Check what events exist (only in dev mode)
  useEffect(() => {
    if (!partnerId || !import.meta.env.DEV) return;
    
    const checkEvents = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
        const response = await fetch(`${API_BASE_URL}/api/analytics/debug/partner/${partnerId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('kosmix_auth_token') || ''}`
          }
        });
        if (response.ok) {
          const debugData = await response.json();
          console.log("Analytics Debug Data:", debugData);
        }
      } catch (error) {
        console.error("Debug query failed:", error);
      }
    };
    checkEvents();
  }, [partnerId]);

  const timeSeriesData = timeSeries?.dataPoints?.map(point => ({
    date: new Date(point.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      ...(granularity === 'week' && { week: 'numeric' }),
      ...(granularity === 'month' && { month: 'short' })
    }),
    views: point.views,
    enquiries: point.enquiries,
    clicks: point.clicks
  })) || [];

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Your Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Performance metrics for your listings
          </p>
        </div>
        <div className="flex gap-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={granularity} onValueChange={(v) => setGranularity(v as "day" | "week" | "month")}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Daily</SelectItem>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.views?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              Listing detail views
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enquiries</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.enquiries?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              Conversion rate: {analytics?.conversionRate?.toFixed(1) || 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.conversionRate?.toFixed(1) || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Views to enquiries conversion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Time Series Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {timeSeriesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="views" stroke="#0088FE" name="Views" strokeWidth={2} />
                <Line type="monotone" dataKey="enquiries" stroke="#00C49F" name="Enquiries" strokeWidth={2} />
                {timeSeriesData.some(d => d.clicks) && (
                  <Line type="monotone" dataKey="clicks" stroke="#FF8042" name="Clicks" strokeWidth={2} />
                )}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-96 flex items-center justify-center text-muted-foreground">
              No data available for the selected period
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Listings */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Listings</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics?.topListings && analytics.topListings.length > 0 ? (
            <div className="space-y-4">
              {analytics.topListings.map((listing: any, index: number) => (
                <div key={listing.listingId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{listing.displayName}</p>
                      <p className="text-sm text-muted-foreground">
                        {listing.views} views • {listing.enquiries} enquiries
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No listing data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
