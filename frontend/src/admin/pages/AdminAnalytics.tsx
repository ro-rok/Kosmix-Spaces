import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Eye, MessageCircle, Search, Users } from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function AdminAnalytics() {
  const [dateRange, setDateRange] = useState("30"); // days
  const [granularity, setGranularity] = useState<"day" | "week" | "month">("day");

  const startDate = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString();
  const endDate = new Date().toISOString();

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["admin-analytics", dateRange],
    queryFn: () => api.analytics.getAdminAnalytics({
      startDate,
      endDate
    })
  });

  const { data: timeSeries, isLoading: timeSeriesLoading } = useQuery({
    queryKey: ["admin-time-series", dateRange, granularity],
    queryFn: () => api.analytics.getTimeSeries({
      startDate,
      endDate,
      granularity
    })
  });

  const { data: funnel, isLoading: funnelLoading } = useQuery({
    queryKey: ["admin-funnel", dateRange],
    queryFn: () => api.analytics.getConversionFunnel({
      startDate,
      endDate
    })
  });

  if (analyticsLoading || timeSeriesLoading || funnelLoading) {
    return (
      <div className="container py-8 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const timeSeriesData = timeSeries?.dataPoints?.map(point => ({
    date: new Date(point.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      ...(granularity === 'week' && { week: 'numeric' }),
      ...(granularity === 'month' && { month: 'short' })
    }),
    views: point.views,
    enquiries: point.enquiries,
    searches: point.searches,
    clicks: point.clicks
  })) || [];

  const funnelData = funnel ? [
    { name: 'Page Views', value: funnel.page_views },
    { name: 'Listing Views', value: funnel.listing_views },
    { name: 'Enquiries', value: funnel.enquiries },
    { name: 'WhatsApp Clicks', value: funnel.whatsapp_clicks },
    { name: 'Call Clicks', value: funnel.call_clicks },
    { name: 'Email Clicks', value: funnel.email_clicks }
  ].filter(item => item.value > 0) : [];

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive insights into platform performance
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalViews?.toLocaleString() || 0}</div>
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
            <div className="text-2xl font-bold">{analytics?.totalEnquiries?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              Conversion rate: {analytics?.conversionRate?.toFixed(1) || 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Searches</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalSearches?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              Search queries performed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partner Signups</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.partnerSignups?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              New partner registrations
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
                <Line type="monotone" dataKey="views" stroke="#0088FE" name="Views" />
                <Line type="monotone" dataKey="enquiries" stroke="#00C49F" name="Enquiries" />
                <Line type="monotone" dataKey="searches" stroke="#FFBB28" name="Searches" />
                <Line type="monotone" dataKey="clicks" stroke="#FF8042" name="Clicks" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-96 flex items-center justify-center text-muted-foreground">
              No data available for the selected period
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          {funnelData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={funnelData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-96 flex items-center justify-center text-muted-foreground">
              No funnel data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Listings and Localities */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Listings</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.topListings && analytics.topListings.length > 0 ? (
              <div className="space-y-4">
                {analytics.topListings.slice(0, 5).map((listing: any, index: number) => (
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

        <Card>
          <CardHeader>
            <CardTitle>Top Localities</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.topLocalities && analytics.topLocalities.length > 0 ? (
              <div className="space-y-4">
                {analytics.topLocalities.slice(0, 5).map((locality: any, index: number) => (
                  <div key={locality.locality} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{locality.locality}</p>
                        <p className="text-sm text-muted-foreground">
                          {locality.searches} searches • {locality.views} views
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No locality data available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
