import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface TopTableRow {
  id: string;
  name: string;
  views: number;
  enquiries: number;
  conversionRate: number;
  [key: string]: any;
}

interface TopTableProps {
  title: string;
  data: TopTableRow[];
  isLoading?: boolean;
  onExport?: () => void;
  className?: string;
}

type SortField = 'views' | 'enquiries' | 'conversionRate';
type SortDirection = 'asc' | 'desc';

export function TopTable({ title, data, isLoading, onExport, className }: TopTableProps) {
  const [sortField, setSortField] = useState<SortField>('views');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (sortDirection === 'asc') {
      return aValue - bValue;
    } else {
      return bValue - aValue;
    }
  });

  const handleExportCSV = () => {
    if (!onExport) {
      // Default CSV export
      const headers = ['Rank', 'Name', 'Views', 'Enquiries', 'Conversion Rate (%)'];
      const rows = sortedData.map((row, index) => [
        index + 1,
        row.name,
        row.views,
        row.enquiries,
        row.conversionRate.toFixed(2)
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } else {
      onExport();
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 py-4">
            <p className="text-muted-foreground text-sm">No data available for this period.</p>
            <p className="text-xs text-muted-foreground">
              {title.includes("Workspace") 
                ? "Workspaces are calculated from listing views and enquiries. Make sure events have partnerId set."
                : "Localities are calculated from listing views and enquiries. Make sure events have locality field populated."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 font-medium">Rank</th>
                <th className="text-left p-2 font-medium">Name</th>
                <th 
                  className="text-right p-2 font-medium cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('views')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Views
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th 
                  className="text-right p-2 font-medium cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('enquiries')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Enquiries
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th 
                  className="text-right p-2 font-medium cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('conversionRate')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Conversion %
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((row, index) => (
                <tr key={row.id} className="border-b hover:bg-muted/50">
                  <td className="p-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold">
                      {index + 1}
                    </div>
                  </td>
                  <td className="p-2 font-medium">{row.name}</td>
                  <td className="p-2 text-right">{row.views.toLocaleString()}</td>
                  <td className="p-2 text-right">{row.enquiries.toLocaleString()}</td>
                  <td className="p-2 text-right">{row.conversionRate.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
