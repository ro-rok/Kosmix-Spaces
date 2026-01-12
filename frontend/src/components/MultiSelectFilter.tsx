import { useState } from 'react';
import { Check, ChevronDown, X, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Option {
  value: string;
  label: string;
  icon?: LucideIcon;
}

interface MultiSelectFilterProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  maxDisplay?: number;
  className?: string;
}

export function MultiSelectFilter({
  options,
  value,
  onChange,
  placeholder = "Select options...",
  searchPlaceholder = "Search...",
  maxDisplay = 2,
  className
}: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const handleRemove = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter(v => v !== optionValue));
  };

  const selectedOptions = options.filter(option => value.includes(option.value));
  const displayText = selectedOptions.length === 0 
    ? placeholder
    : selectedOptions.length <= maxDisplay
    ? selectedOptions.map(opt => opt.label).join(', ')
    : `${selectedOptions.slice(0, maxDisplay).map(opt => opt.label).join(', ')} +${selectedOptions.length - maxDisplay}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
        >
          <span className="truncate">{displayText}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandEmpty>No options found.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {options.map((option) => (
              <CommandItem
                key={option.value}
                onSelect={() => handleSelect(option.value)}
                className="cursor-pointer"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value.includes(option.value) ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.icon && (
                  <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                )}
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface FilterChipsProps {
  selectedOptions: Option[];
  onRemove: (value: string) => void;
  className?: string;
}

export function FilterChips({ selectedOptions, onRemove, className }: FilterChipsProps) {
  if (selectedOptions.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {selectedOptions.map((option) => (
        <Badge
          key={option.value}
          variant="secondary"
          className="gap-1 pr-1"
        >
          {option.icon && <option.icon className="h-3 w-3" />}
          {option.label}
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0.5 hover:bg-transparent"
            onClick={() => onRemove(option.value)}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
    </div>
  );
}