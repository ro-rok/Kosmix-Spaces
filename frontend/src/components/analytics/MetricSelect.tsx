import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type Metric = 'views' | 'clicks' | 'enquiries' | 'whatsapp' | 'calls' | 'emails';

interface MetricSelectProps {
  selected: Metric[];
  onChange: (metrics: Metric[]) => void;
  className?: string;
}

const allMetrics: { value: Metric; label: string }[] = [
  { value: 'views', label: 'Views' },
  { value: 'clicks', label: 'Clicks' },
  { value: 'enquiries', label: 'Enquiries' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'calls', label: 'Calls' },
  { value: 'emails', label: 'Emails' },
];

export function MetricSelect({ selected, onChange, className }: MetricSelectProps) {
  const toggleMetric = (metric: Metric) => {
    if (selected.includes(metric)) {
      // Don't allow deselecting if it's the last one
      if (selected.length > 1) {
        onChange(selected.filter(m => m !== metric));
      }
    } else {
      onChange([...selected, metric]);
    }
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {allMetrics.map((metric) => (
        <Button
          key={metric.value}
          variant={selected.includes(metric.value) ? "default" : "outline"}
          size="sm"
          onClick={() => toggleMetric(metric.value)}
          className={cn(
            "text-xs",
            selected.includes(metric.value) && "font-semibold"
          )}
        >
          {metric.label}
        </Button>
      ))}
    </div>
  );
}
