import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { RefreshCw, Eye, MousePointerClick, MessageCircle, Phone, Mail, MessageSquare } from "lucide-react";
import { KPICard } from "@/components/analytics/KPICard";
import { DateRangePicker, DateRangePreset } from "@/components/analytics/DateRangePicker";
import { MetricSelect, Metric } from "@/components/analytics/MetricSelect";
import { TimeseriesLineChart } from "@/components/analytics/TimeseriesLineChart";
import { FunnelBar } from "@/components/analytics/FunnelBar";
import { TopTable } from "@/components/analytics/TopTable";
import { InsightsPanel } from "@/components/analytics/InsightsPanel";

export function AdminAnalytics() {
  const [dateRange, setDateRange] = useState<DateRangePreset>("7d");
  const [selectedMetrics, setSelectedMetrics] = useState<Metric[]>(['views', 'enquiries']);
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
    queryKey: ["admin-analytics-overview", startDate, endDate],
    queryFn: () => api.analytics.admin.getOverview({ start: startDate, end: endDate }),
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: true,
  });

  // Fetch time series data
  const { data: timeSeries, isLoading: timeSeriesLoading, refetch: refetchTimeSeries } = useQuery({
    queryKey: ["admin-analytics-timeseries", startDate, endDate, selectedMetrics],
    queryFn: () => api.analytics.admin.getTimeSeries({ start: startDate, end: endDate }),
    staleTime: 60000,
    refetchOnWindowFocus: true,
  });

  // Fetch top workspaces
  const { data: topWorkspaces, isLoading: workspacesLoading, refetch: refetchWorkspaces } = useQuery({
    queryKey: ["admin-top-workspaces", startDate, endDate],
    queryFn: () => api.analytics.admin.getTopWorkspaces({ start: startDate, end: endDate, limit: 10 }),
    staleTime: 60000,
    refetchOnWindowFocus: true,
  });

  // Fetch top localities
  const { data: topLocalities, isLoading: localitiesLoading, refetch: refetchLocalities } = useQuery({
    queryKey: ["admin-top-localities", startDate, endDate],
    queryFn: () => api.analytics.admin.getTopLocalities({ start: startDate, end: endDate, limit: 10 }),
    staleTime: 60000,
    refetchOnWindowFocus: true,
  });

  // Fetch funnel data
  const { data: funnel, isLoading: funnelLoading, refetch: refetchFunnel } = useQuery({
    queryKey: ["admin-funnel", startDate, endDate],
    queryFn: () => api.analytics.admin.getFunnel({ start: startDate, end: endDate }),
    staleTime: 60000,
    refetchOnWindowFocus: true,
  });

  // Fetch insights
  const { data: insights, isLoading: insightsLoading, refetch: refetchInsights } = useQuery({
    queryKey: ["admin-insights", startDate, endDate],
    queryFn: () => api.analytics.admin.getInsights({ start: startDate, end: endDate }),
    staleTime: 60000,
    refetchOnWindowFocus: true,
  });

  const handleRefresh = () => {
    refetchOverview();
    refetchTimeSeries();
    refetchWorkspaces();
    refetchLocalities();
    refetchFunnel();
  };

  // Prepare time series data with selected metrics
  const timeSeriesData = useMemo(() => {
    if (!timeSeries?.dataPoints) return [];
    return timeSeries.dataPoints;
  }, [timeSeries]);

  // Prepare top workspaces data
  const workspacesTableData = useMemo(() => {
    if (!topWorkspaces) return [];
    return topWorkspaces.map(ws => ({
      id: ws.partnerId,
      name: ws.workspaceBrandName || `Partner ${ws.partnerId.slice(0, 8)}`,
      views: ws.views,
      enquiries: ws.enquiries,
      conversionRate: ws.conversionRate,
    }));
  }, [topWorkspaces]);

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

  const isLoading = overviewLoading || timeSeriesLoading || workspacesLoading || localitiesLoading || funnelLoading;

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive insights into platform performance
          </p>
        </div>
        <div className="flex items-center gap-4">
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

      {/* Top Performers */}
      <div className="grid gap-4 md:grid-cols-2">
        <TopTable
          title="Top Workspaces"
          data={workspacesTableData}
          isLoading={workspacesLoading}
        />
        <TopTable
          title="Top Localities"
          data={localitiesTableData}
          isLoading={localitiesLoading}
        />
      </div>
    </div>
  );
}
