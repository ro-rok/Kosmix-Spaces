import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface FunnelStage {
  stage: string;
  count: number;
  conversionRate: number;
  dropOff: number;
}

interface FunnelBarProps {
  stages: FunnelStage[];
  isLoading?: boolean;
  className?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function FunnelBar({ stages, isLoading, className }: FunnelBarProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!stages || stages.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center text-muted-foreground">
            No funnel data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = stages.map((stage, index) => ({
    name: stage.stage,
    count: stage.count,
    conversionRate: stage.conversionRate,
    dropOff: stage.dropOff,
  }));

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Conversion Funnel</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={120} />
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === 'count') {
                  return [value.toLocaleString(), 'Count'];
                }
                if (name === 'conversionRate') {
                  return [`${value.toFixed(1)}%`, 'Conversion Rate'];
                }
                return [value, name];
              }}
            />
            <Legend />
            <Bar dataKey="count" fill="#0088FE" name="Count">
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-2">
          {stages.map((stage, index) => (
            <div key={stage.stage} className="flex items-center justify-between text-sm">
              <span className="font-medium">{stage.stage}</span>
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground">
                  {stage.count.toLocaleString()} events
                </span>
                {index > 0 && (
                  <span className={stage.conversionRate >= 50 ? "text-green-600" : "text-orange-600"}>
                    {stage.conversionRate.toFixed(1)}% conversion
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
