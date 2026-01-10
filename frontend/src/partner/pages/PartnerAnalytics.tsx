import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { TrendingUp, Eye, MessageSquare, BarChart3, RefreshCw } from 'lucide-react';
import { analytics, PartnerAnalytics as PartnerAnalyticsData } from '@/lib/analytics';
import { usePartnerMe } from '@/hooks/useAuth';

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

interface ListingPerformanceProps {
  listing: {
    listingId: string;
    displayName: string;
    views: number;
    enquiries: number;
  };
}

const ListingPerformanceCard: React.FC<ListingPerformanceProps> = ({ listing }) => {
  const conversionRate = listing.views > 0 ? ((listing.enquiries / listing.views) * 100).toFixed(1) : '0.0';
  
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex-1">
        <h4 className="font-medium text-sm mb-1">{listing.displayName}</h4>
        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
          <span className="flex items-center">
            <Eye className="h-3 w-3 mr-1" />
            {listing.views} views
          </span>
          <span className="flex items-center">
            <MessageSquare className="h-3 w-3 mr-1" />
            {listing.enquiries} enquiries
          </span>
        </div>
      </div>
      <div className="text-right">
        <div className="text-lg font-semibold">{conversionRate}%</div>
        <div className="text-xs text-muted-foreground">conversion</div>
      </div>
    </div>
  );
};

const PartnerAnalytics: React.FC = () => {
  const { data: user } = usePartnerMe();
  const [analyticsData, setAnalyticsData] = useState<PartnerAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    if (!user?.partnerId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await analytics.getPartnerAnalytics(user.partnerId);
      setAnalyticsData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [user?.partnerId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">Your listing performance insights</p>
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
        
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
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
        
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">Your listing performance insights</p>
          </div>
          <Button onClick={fetchAnalytics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Your listing performance insights</p>
        </div>
        <Button onClick={fetchAnalytics} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Total Views"
          value={analyticsData.views.toLocaleString()}
          description="Listing page views this month"
          icon={<Eye className="h-4 w-4 text-muted-foreground" />}
          trend={{ value: 12.3, isPositive: true }}
        />
        
        <MetricCard
          title="Enquiries"
          value={analyticsData.enquiries.toLocaleString()}
          description="Customer enquiries received"
          icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />}
          trend={{ value: 8.7, isPositive: true }}
        />
        
        <MetricCard
          title="Conversion Rate"
          value={`${analyticsData.conversionRate}%`}
          description="Views to enquiries ratio"
          icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
          trend={{ value: -2.1, isPositive: false }}
        />
      </div>

      {/* Listing Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Listing Performance</CardTitle>
          <CardDescription>
            Individual performance metrics for each of your listings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analyticsData.topListings.length > 0 ? (
            <div className="space-y-3">
              {analyticsData.topListings.map((listing) => (
                <ListingPerformanceCard
                  key={listing.listingId}
                  listing={listing}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                No listing performance data available yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Analytics will appear once your listings start receiving views
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Tips */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">Performance Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-blue-800">
            <p>• <strong>Add high-quality photos</strong> to increase view-to-enquiry conversion</p>
            <p>• <strong>Complete all offering details</strong> to improve search visibility</p>
            <p>• <strong>Respond quickly to enquiries</strong> to build trust and credibility</p>
            <p>• <strong>Keep pricing competitive</strong> within your locality's budget bands</p>
          </div>
        </CardContent>
      </Card>

      {/* Growth Tips */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-900">Growth Opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-green-800">
            <p>• <strong>Optimize photos</strong> - Listings with 5+ photos get 3x more views</p>
            <p>• <strong>Update descriptions</strong> - Detailed offerings increase enquiry rates</p>
            <p>• <strong>Competitive pricing</strong> - Stay within 10% of locality average</p>
            <p>• <strong>Quick responses</strong> - Reply to enquiries within 2 hours for best results</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PartnerAnalytics;