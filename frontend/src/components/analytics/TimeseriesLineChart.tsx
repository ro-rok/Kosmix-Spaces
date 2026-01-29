import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Metric } from "./MetricSelect";

interface TimeSeriesDataPoint {
  date: string;
  views: number;
  enquiries: number;
  searches: number;
  clicks: number;
  whatsapp: number;
  calls: number;
  emails: number;
}

interface TimeseriesLineChartProps {
  data: TimeSeriesDataPoint[];
  selectedMetrics: Metric[];
  isLoading?: boolean;
  className?: string;
}

const metricColors: Record<Metric, string> = {
  views: '#0088FE',
  clicks: '#FF8042',
  enquiries: '#00C49F',
  whatsapp: '#25D366',
  calls: '#34B7F1',
  emails: '#8884d8',
};

const metricLabels: Record<Metric, string> = {
  views: 'Views',
  clicks: 'Clicks',
  enquiries: 'Enquiries',
  whatsapp: 'WhatsApp',
  calls: 'Calls',
  emails: 'Emails',
};

export function TimeseriesLineChart({
  data,
  selectedMetrics,
  isLoading,
  className
}: TimeseriesLineChartProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Activity Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Activity Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center text-muted-foreground">
            No data available for the selected period
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format dates for display
  const formattedData = data.map(point => ({
    ...point,
    date: new Date(point.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }));

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Activity Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            {selectedMetrics.map((metric) => (
              <Line
                key={metric}
                type="monotone"
                dataKey={metric}
                stroke={metricColors[metric]}
                name={metricLabels[metric]}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
