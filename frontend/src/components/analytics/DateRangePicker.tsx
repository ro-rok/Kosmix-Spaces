import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useState, useEffect } from "react";

export type DateRangePreset = "7d" | "14d" | "30d" | "custom";

interface DateRangePickerProps {
  value: DateRangePreset;
  onChange: (preset: DateRangePreset) => void;
  startDate?: Date;
  endDate?: Date;
  onCustomRangeChange?: (start: Date, end: Date) => void;
}

export function DateRangePicker({
  value,
  onChange,
  startDate,
  endDate,
  onCustomRangeChange
}: DateRangePickerProps) {
  const [customStart, setCustomStart] = useState<Date | undefined>(startDate);
  const [customEnd, setCustomEnd] = useState<Date | undefined>(endDate);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (startDate) setCustomStart(startDate);
    if (endDate) setCustomEnd(endDate);
  }, [startDate, endDate]);

  const handlePresetChange = (preset: string) => {
    onChange(preset as DateRangePreset);
    if (preset !== "custom") {
      setIsOpen(false);
    }
  };

  const handleCustomRangeApply = () => {
    if (customStart && customEnd && onCustomRangeChange) {
      onCustomRangeChange(customStart, customEnd);
      onChange("custom");
      setIsOpen(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Select value={value} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7d">Last 7 days</SelectItem>
          <SelectItem value="14d">Last 14 days</SelectItem>
          <SelectItem value="30d">Last 30 days</SelectItem>
          <SelectItem value="custom">Custom range</SelectItem>
        </SelectContent>
      </Select>
      
      {value === "custom" && (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-64 justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {customStart && customEnd ? (
                `${format(customStart, "MMM dd")} - ${format(customEnd, "MMM dd")}`
              ) : (
                "Pick a date range"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Calendar
                  mode="single"
                  selected={customStart}
                  onSelect={setCustomStart}
                  initialFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Calendar
                  mode="single"
                  selected={customEnd}
                  onSelect={setCustomEnd}
                  disabled={(date) => customStart ? date < customStart : false}
                />
              </div>
              <Button 
                onClick={handleCustomRangeApply}
                disabled={!customStart || !customEnd}
                className="w-full"
              >
                Apply
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
