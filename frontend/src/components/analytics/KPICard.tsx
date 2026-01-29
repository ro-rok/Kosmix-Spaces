import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Minus, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PeriodComparison {
  current: number;
  previous: number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
}

interface KPICardProps {
  title: string;
  icon: LucideIcon;
  value: number | PeriodComparison;
  subtitle?: string;
  formatValue?: (value: number) => string;
  className?: string;
  isLoading?: boolean;
}

export function KPICard({ 
  title, 
  icon: Icon, 
  value, 
  subtitle,
  formatValue = (v) => v.toLocaleString(),
  className 
}: KPICardProps) {
  const isPeriodComparison = typeof value === 'object' && 'current' in value;
  const displayValue = isPeriodComparison ? value.current : value;
  const trend = isPeriodComparison ? value.trend : undefined;
  const change = isPeriodComparison ? value.change : undefined;

  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatValue(displayValue)}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {isPeriodComparison && trend && change !== undefined && (
          <div className="flex items-center gap-1 mt-2">
            {trend === 'up' && (
              <ArrowUp className="h-3 w-3 text-green-600" />
            )}
            {trend === 'down' && (
              <ArrowDown className="h-3 w-3 text-red-600" />
            )}
            {trend === 'neutral' && (
              <Minus className="h-3 w-3 text-muted-foreground" />
            )}
            <span
              className={cn(
                "text-xs font-medium",
                trend === 'up' && "text-green-600",
                trend === 'down' && "text-red-600",
                trend === 'neutral' && "text-muted-foreground"
              )}
            >
              {Math.abs(change).toFixed(1)}% vs previous period
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
