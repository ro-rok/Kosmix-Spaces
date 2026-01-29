import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { RefreshCw, Eye, MousePointerClick, MessageCircle, Phone, Mail, MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePartnerMe } from "@/hooks/useAuth";
import { KPICard } from "@/components/analytics/KPICard";
import { DateRangePicker, DateRangePreset } from "@/components/analytics/DateRangePicker";
import { MetricSelect, Metric } from "@/components/analytics/MetricSelect";
import { TimeseriesLineChart } from "@/components/analytics/TimeseriesLineChart";
import { FunnelBar } from "@/components/analytics/FunnelBar";
import { TopTable } from "@/components/analytics/TopTable";
import { InsightsPanel } from "@/components/analytics/InsightsPanel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePartnerListings } from "@/hooks/useAuth";

export function PartnerAnalytics() {
  const { user } = useAuth();
  const { data: partner } = usePartnerMe();
  // Get partnerId from multiple sources - partner data, user object, or localStorage
  const partnerId = partner?.partnerId || user?.partnerId || user?.id || localStorage.getItem('kosmix_partner_id');
  const { data: listingsData } = usePartnerListings();
  const listings = listingsData || [];

  const [dateRange, setDateRange] = useState<DateRangePreset>("7d");
  const [selectedMetrics, setSelectedMetrics] = useState<Metric[]>(['views', 'enquiries']);
  const [selectedListingId, setSelectedListingId] = useState<string>("all");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();

  // Calculate date range
  const { startDate, endDate } = useMemo(() => {
    const end = customEndDate || new Date();
    let start: Date;
    
    if (dateRange === "custom" && customStartDate) {
      start = customStartDate;
    } else {
      const days = dateRange === "7d" ? 7 : dateRange === "14d" ? 14 : 30;
      start = new Date(end);
      start.setDate(start.getDate() - days);
    }
    
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString()
    };
  }, [dateRange, customStartDate, customEndDate]);

  // Fetch overview data
  const { data: overview, isLoading: overviewLoading, refetch: refetchOverview } = useQuery({
    queryKey: ["partner-analytics-overview", partnerId, startDate, endDate],
    queryFn: () => api.analytics.partner.getOverview({ start: startDate, end: endDate }),
    enabled: !!partnerId && !!user, // Ensure user is authenticated
    staleTime: 60000,
    refetchOnWindowFocus: true,
  });

  // Fetch time series data
  const { data: timeSeries, isLoading: timeSeriesLoading, refetch: refetchTimeSeries } = useQuery({
    queryKey: ["partner-analytics-timeseries", partnerId, startDate, endDate, selectedMetrics],
    queryFn: () => api.analytics.partner.getTimeSeries({ start: startDate, end: endDate }),
    enabled: !!partnerId && !!user, // Ensure user is authenticated
    staleTime: 60000,
    refetchOnWindowFocus: true,
  });

  // Fetch top localities
  const { data: topLocalities, isLoading: localitiesLoading, refetch: refetchLocalities } = useQuery({
    queryKey: ["partner-top-localities", partnerId, startDate, endDate],
    queryFn: () => api.analytics.partner.getTopLocalities({ start: startDate, end: endDate, limit: 10 }),
    enabled: !!partnerId && !!user, // Ensure user is authenticated
    staleTime: 60000,
    refetchOnWindowFocus: true,
  });

  // Fetch funnel data
  const { data: funnel, isLoading: funnelLoading, refetch: refetchFunnel } = useQuery({
    queryKey: ["partner-funnel", partnerId, startDate, endDate],
    queryFn: () => api.analytics.partner.getFunnel({ start: startDate, end: endDate }),
    enabled: !!partnerId && !!user, // Ensure user is authenticated
    staleTime: 60000,
    refetchOnWindowFocus: true,
  });

  // Fetch insights
  const { data: insights, isLoading: insightsLoading, refetch: refetchInsights } = useQuery({
    queryKey: ["partner-insights", partnerId, startDate, endDate],
    queryFn: () => api.analytics.partner.getInsights({ start: startDate, end: endDate }),
    enabled: !!partnerId && !!user, // Ensure user is authenticated
    staleTime: 60000,
    refetchOnWindowFocus: true,
  });

  const handleRefresh = () => {
    refetchOverview();
    refetchTimeSeries();
    refetchLocalities();
    refetchFunnel();
    refetchInsights();
  };

  // Prepare time series data
  const timeSeriesData = useMemo(() => {
    if (!timeSeries?.dataPoints) return [];
    return timeSeries.dataPoints;
  }, [timeSeries]);

  // Prepare top localities data
  const localitiesTableData = useMemo(() => {
    if (!topLocalities) return [];
    return topLocalities.map(loc => ({
      id: loc.locality,
      name: loc.locality,
      views: loc.views,
      enquiries: loc.enquiries,
      conversionRate: loc.conversionRate,
    }));
  }, [topLocalities]);

  const isLoading = overviewLoading || timeSeriesLoading || localitiesLoading || funnelLoading || insightsLoading;

  if (!partnerId || !user) {
    return (
      <div className="container py-8">
        <div className="space-y-2">
          <p className="text-muted-foreground">Please log in to view analytics</p>
          {!partnerId && (
            <p className="text-sm text-destructive">
              Partner ID not found. Please try logging out and logging back in.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Your Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Performance metrics for your listings
          </p>
        </div>
        <div className="flex items-center gap-4">
          {listings.length > 0 && (
            <Select value={selectedListingId} onValueChange={setSelectedListingId}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Listings</SelectItem>
                {listings.map((listing: any) => {
                  const listingId = listing.listingId || listing.id || listing._id;
                  const displayName = listing.displayName || listing.slug || `Listing ${listingId?.slice(0, 8)}`;
                  // Skip if listingId is empty or invalid
                  if (!listingId || listingId === '') return null;
                  return (
                    <SelectItem key={listingId} value={String(listingId)}>
                      {displayName}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            startDate={customStartDate}
            endDate={customEndDate}
            onCustomRangeChange={(start, end) => {
              setCustomStartDate(start);
              setCustomEndDate(end);
            }}
          />
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <KPICard
          title="Views"
          icon={Eye}
          value={overview?.views || { current: 0, previous: 0, change: 0, trend: 'neutral' }}
          isLoading={overviewLoading}
        />
        <KPICard
          title="Clicks"
          icon={MousePointerClick}
          value={overview?.clicks || { current: 0, previous: 0, change: 0, trend: 'neutral' }}
          isLoading={overviewLoading}
        />
        <KPICard
          title="Enquiries"
          icon={MessageCircle}
          value={overview?.enquiries || { current: 0, previous: 0, change: 0, trend: 'neutral' }}
          isLoading={overviewLoading}
        />
        <KPICard
          title="WhatsApp"
          icon={MessageSquare}
          value={overview?.whatsappClicks || { current: 0, previous: 0, change: 0, trend: 'neutral' }}
          isLoading={overviewLoading}
        />
        <KPICard
          title="Calls"
          icon={Phone}
          value={overview?.callClicks || { current: 0, previous: 0, change: 0, trend: 'neutral' }}
          isLoading={overviewLoading}
        />
        <KPICard
          title="Emails"
          icon={Mail}
          value={overview?.emailClicks || { current: 0, previous: 0, change: 0, trend: 'neutral' }}
          isLoading={overviewLoading}
        />
      </div>

      {/* Conversion Rates */}
      <div className="grid gap-4 md:grid-cols-3">
        <KPICard
          title="Click → Enquiry"
          icon={MousePointerClick}
          value={overview?.clickToEnquiryRate || 0}
          subtitle="Conversion rate"
          formatValue={(v) => `${v.toFixed(1)}%`}
          isLoading={overviewLoading}
        />
        <KPICard
          title="View → Enquiry"
          icon={Eye}
          value={overview?.viewToEnquiryRate || 0}
          subtitle="Conversion rate"
          formatValue={(v) => `${v.toFixed(1)}%`}
          isLoading={overviewLoading}
        />
        <KPICard
          title="WhatsApp Share"
          icon={MessageSquare}
          value={overview?.whatsappShareRate || 0}
          subtitle="Share rate"
          formatValue={(v) => `${v.toFixed(1)}%`}
          isLoading={overviewLoading}
        />
      </div>

      {/* Time Series Chart */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Activity Over Time</h2>
          <MetricSelect
            selected={selectedMetrics}
            onChange={setSelectedMetrics}
          />
        </div>
        <TimeseriesLineChart
          data={timeSeriesData}
          selectedMetrics={selectedMetrics}
          isLoading={timeSeriesLoading}
        />
      </div>

      {/* Funnel and Insights */}
      <div className="grid gap-4 md:grid-cols-2">
        <FunnelBar
          stages={funnel?.stages || []}
          isLoading={funnelLoading}
        />
        <InsightsPanel
          insights={insights?.insights || []}
          isLoading={insightsLoading}
        />
      </div>

      {/* Top Localities */}
      <TopTable
        title="Top Localities"
        data={localitiesTableData}
        isLoading={localitiesLoading}
      />
    </div>
  );
}
