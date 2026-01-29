import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Insight {
  type: string;
  message: string;
  value?: any;
}

interface InsightsPanelProps {
  insights: Insight[];
  isLoading?: boolean;
  className?: string;
}

export function InsightsPanel({ insights, isLoading, className }: InsightsPanelProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights || insights.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">
              No insights available for this period.
            </p>
            <p className="text-xs text-muted-foreground">
              Insights are calculated from listing views, enquiries, and clicks. Make sure events are being tracked.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Filter out "no_data" insights and show them as empty state instead
  const displayInsights = insights.filter(insight => insight.type !== "no_data");
  const hasNoDataInsight = insights.some(insight => insight.type === "no_data");
  
  if (displayInsights.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">
              No insights available for this period.
            </p>
            <p className="text-xs text-muted-foreground">
              Insights are calculated from listing views, enquiries, and clicks. Make sure events are being tracked.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayInsights.map((insight, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
            >
              <TrendingUp className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">{insight.message}</p>
                {insight.value && typeof insight.value === 'object' && (
                  <div className="text-xs text-muted-foreground mt-1 space-y-1">
                    {insight.value.locality && (
                      <div>Locality: {insight.value.locality}</div>
                    )}
                    {insight.value.views !== undefined && (
                      <div>Views: {insight.value.views.toLocaleString()}</div>
                    )}
                    {insight.value.enquiries !== undefined && (
                      <div>Enquiries: {insight.value.enquiries.toLocaleString()}</div>
                    )}
                    {insight.value.rate !== undefined && (
                      <div>Rate: {insight.value.rate.toFixed(1)}%</div>
                    )}
                    {insight.value.channel && (
                      <div>Channel: {insight.value.channel}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
