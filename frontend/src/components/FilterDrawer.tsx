"use client";

import { useState } from "react";
import { Filter, X, Train, Car, Zap, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { localities } from "@/data/localities";
import { budgetBandLabels, workspaceTypeLabels, teamSizeBands, BudgetBand, WorkspaceType } from "@/data/listings";
import { FilterState, hasActiveFilters } from "@/lib/filters";

interface FilterDrawerProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onClear: () => void;
}

export function FilterDrawer({ filters, onChange, onClear }: FilterDrawerProps) {
  const [open, setOpen] = useState(false);
  const activeCount = Object.values(filters).filter(Boolean).length;

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filters
          {activeCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="font-display">Filters</SheetTitle>
            {hasActiveFilters(filters) && (
              <Button variant="ghost" size="sm" onClick={onClear}>
                Clear all
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Locality */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Locality</Label>
            <Select
              value={filters.locality}
              onValueChange={(value) => updateFilter("locality", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All localities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All localities</SelectItem>
                {localities.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Budget Band */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Budget Range</Label>
            <Select
              value={filters.budgetBand}
              onValueChange={(value) => updateFilter("budgetBand", value as BudgetBand | "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any budget" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any budget</SelectItem>
                {Object.entries(budgetBandLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Team Size */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Team Size</Label>
            <Select
              value={filters.teamSize}
              onValueChange={(value) => updateFilter("teamSize", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any size</SelectItem>
                {teamSizeBands.map((band) => (
                  <SelectItem key={band.value} value={band.value}>
                    {band.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Space Type */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Space Type</Label>
            <Select
              value={filters.spaceType}
              onValueChange={(value) => updateFilter("spaceType", value as WorkspaceType | "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All types</SelectItem>
                {Object.entries(workspaceTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Toggle Filters */}
          <div className="space-y-4 rounded-lg bg-muted/50 p-4">
            <h4 className="text-sm font-medium">Must Have</h4>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Train className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="nearMetro" className="text-sm">
                  Near Metro
                </Label>
              </div>
              <Switch
                id="nearMetro"
                checked={filters.nearMetro}
                onCheckedChange={(checked) => updateFilter("nearMetro", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="parking" className="text-sm">
                  Parking Available
                </Label>
              </div>
              <Switch
                id="parking"
                checked={filters.parking}
                onCheckedChange={(checked) => updateFilter("parking", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="powerBackup" className="text-sm">
                  Power Backup
                </Label>
              </div>
              <Switch
                id="powerBackup"
                checked={filters.powerBackup}
                onCheckedChange={(checked) => updateFilter("powerBackup", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="gstInvoice" className="text-sm">
                  GST Invoice
                </Label>
              </div>
              <Switch
                id="gstInvoice"
                checked={filters.gstInvoice}
                onCheckedChange={(checked) => updateFilter("gstInvoice", checked)}
              />
            </div>
          </div>

          {/* Apply Button */}
          <Button
            className="w-full"
            size="lg"
            onClick={() => setOpen(false)}
          >
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
