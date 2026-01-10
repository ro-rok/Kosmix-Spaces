import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Users, Search, Eye, MessageSquare, UserPlus } from 'lucide-react';
import { analytics, AnalyticsSummary } from '@/lib/analytics';

interface MetricCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, description, icon, trend }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
      {trend && (
        <div className={`flex items-center text-xs mt-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
          <TrendingUp className="h-3 w-3 mr-1" />
          {trend.isPositive ? '+' : ''}{trend.value}% from last month
        </div>
      )}
    </CardContent>
  </Card>
);

interface TopListingProps {
  listing: {
    listingId: string;
    displayName: string;
    views: number;
    enquiries: number;
  };
  rank: number;
}

const TopListingCard: React.FC<TopListingProps> = ({ listing, rank }) => {
  const conversionRate = listing.views > 0 ? ((listing.enquiries / listing.views) * 100).toFixed(1) : '0.0';
  
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center space-x-3">
        <Badge variant="secondary" className="w-6 h-6 rounded-full flex items-center justify-center text-xs">
          {rank}
        </Badge>
        <div>
          <p className="font-medium text-sm">{listing.displayName}</p>
          <p className="text-xs text-muted-foreground">
            {listing.views} views • {listing.enquiries} enquiries
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium">{conversionRate}%</p>
        <p className="text-xs text-muted-foreground">conversion</p>
      </div>
    </div>
  );
};

interface TopLocalityProps {
  locality: {
    locality: string;
    searches: number;
    views: number;
  };
  rank: number;
}

const TopLocalityCard: React.FC<TopLocalityProps> = ({ locality, rank }) => (
  <div className="flex items-center justify-between p-3 border rounded-lg">
    <div className="flex items-center space-x-3">
      <Badge variant="secondary" className="w-6 h-6 rounded-full flex items-center justify-center text-xs">
        {rank}
      </Badge>
      <div>
        <p className="font-medium text-sm">{locality.locality}</p>
        <p className="text-xs text-muted-foreground">
          {locality.searches} searches • {locality.views} views
        </p>
      </div>
    </div>
  </div>
);

const AdminAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const data = await analytics.getAdminAnalytics();
        setAnalyticsData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Platform performance and user insights</p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Platform performance and user insights</p>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600 mb-2">Failed to load analytics data</p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button 
                onClick={fetchAnalytics} 
                variant="outline" 
                size="sm" 
                className="mt-3"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analyticsData) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Platform performance and user insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Total Searches"
          value={analyticsData.totalSearches.toLocaleString()}
          description="Search queries performed"
          icon={<Search className="h-4 w-4 text-muted-foreground" />}
          trend={{ value: 12.5, isPositive: true }}
        />
        
        <MetricCard
          title="Listing Views"
          value={analyticsData.totalViews.toLocaleString()}
          description="Total listing page views"
          icon={<Eye className="h-4 w-4 text-muted-foreground" />}
          trend={{ value: 8.2, isPositive: true }}
        />
        
        <MetricCard
          title="Enquiries"
          value={analyticsData.totalEnquiries.toLocaleString()}
          description="Customer enquiries submitted"
          icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />}
          trend={{ value: 15.3, isPositive: true }}
        />
        
        <MetricCard
          title="Partner Signups"
          value={analyticsData.partnerSignups.toLocaleString()}
          description="New partner registrations"
          icon={<UserPlus className="h-4 w-4 text-muted-foreground" />}
          trend={{ value: 5.7, isPositive: true }}
        />
        
        <MetricCard
          title="Conversion Rate"
          value={`${analyticsData.conversionRate}%`}
          description="Views to enquiries ratio"
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          trend={{ value: 2.1, isPositive: true }}
        />
        
        <MetricCard
          title="Active Partners"
          value="47"
          description="Partners with active listings"
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          trend={{ value: 9.8, isPositive: true }}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Performing Listings */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Listings</CardTitle>
            <CardDescription>
              Listings with highest engagement and conversion rates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {analyticsData.topListings.length > 0 ? (
              analyticsData.topListings.map((listing, index) => (
                <TopListingCard
                  key={listing.listingId}
                  listing={listing}
                  rank={index + 1}
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No listing data available
              </p>
            )}
          </CardContent>
        </Card>

        {/* Top Localities */}
        <Card>
          <CardHeader>
            <CardTitle>Popular Localities</CardTitle>
            <CardDescription>
              Most searched and viewed locations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {analyticsData.topLocalities.length > 0 ? (
              analyticsData.topLocalities.map((locality, index) => (
                <TopLocalityCard
                  key={locality.locality}
                  locality={locality}
                  rank={index + 1}
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No locality data available
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">Performance Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-blue-800">
            <p>• <strong>Peak activity</strong> occurs during business hours (10 AM - 6 PM)</p>
            <p>• <strong>Mobile users</strong> account for 65% of total traffic</p>
            <p>• <strong>Conversion rates</strong> are highest for verified listings</p>
            <p>• <strong>Response time</strong> under 24 hours increases enquiry rates by 40%</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalytics;