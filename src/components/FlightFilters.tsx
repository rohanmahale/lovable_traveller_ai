import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, SlidersHorizontal, ArrowUpDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Flight } from '@/types/travel';
import { cn } from '@/lib/utils';

export type SortOption = 'price-asc' | 'price-desc' | 'duration-asc' | 'duration-desc' | 'stops-asc' | 'departure-asc' | 'departure-desc';

export interface FlightFilters {
  priceRange: [number, number];
  stops: number[];
  airlines: string[];
  cabinClasses: string[];
  departureTimeRange: [number, number]; // hours 0-24
  arrivalTimeRange: [number, number]; // hours 0-24
}

interface FlightFiltersProps {
  flights: Flight[];
  carriers: Record<string, string>;
  filters: FlightFilters;
  sortBy: SortOption;
  onFiltersChange: (filters: FlightFilters) => void;
  onSortChange: (sort: SortOption) => void;
  onReset: () => void;
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'duration-asc', label: 'Duration: Shortest' },
  { value: 'duration-desc', label: 'Duration: Longest' },
  { value: 'stops-asc', label: 'Stops: Fewest' },
  { value: 'departure-asc', label: 'Departure: Earliest' },
  { value: 'departure-desc', label: 'Departure: Latest' },
];

export function FlightFiltersPanel({
  flights,
  carriers,
  filters,
  sortBy,
  onFiltersChange,
  onSortChange,
  onReset,
}: FlightFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Calculate available options based on flight data
  const filterOptions = useMemo(() => {
    if (flights.length === 0) return null;

    const prices = flights.map(f => f.price.total);
    const uniqueStops = [...new Set(flights.map(f => f.outbound.stops))].sort();
    const uniqueAirlines = [...new Set(flights.map(f => f.outbound.carrier))];
    const uniqueCabinClasses = [...new Set(flights.map(f => f.cabinClass))];

    return {
      minPrice: Math.floor(Math.min(...prices)),
      maxPrice: Math.ceil(Math.max(...prices)),
      stops: uniqueStops,
      airlines: uniqueAirlines,
      cabinClasses: uniqueCabinClasses,
    };
  }, [flights]);

  if (!filterOptions || flights.length === 0) return null;

  const hasActiveFilters = 
    filters.priceRange[0] > filterOptions.minPrice ||
    filters.priceRange[1] < filterOptions.maxPrice ||
    filters.stops.length > 0 ||
    filters.airlines.length > 0 ||
    filters.cabinClasses.length > 0 ||
    filters.departureTimeRange[0] > 0 ||
    filters.departureTimeRange[1] < 24 ||
    filters.arrivalTimeRange[0] > 0 ||
    filters.arrivalTimeRange[1] < 24;

  const activeFilterCount = [
    filters.priceRange[0] > filterOptions.minPrice || filters.priceRange[1] < filterOptions.maxPrice,
    filters.stops.length > 0,
    filters.airlines.length > 0,
    filters.cabinClasses.length > 0,
    filters.departureTimeRange[0] > 0 || filters.departureTimeRange[1] < 24,
    filters.arrivalTimeRange[0] > 0 || filters.arrivalTimeRange[1] < 24,
  ].filter(Boolean).length;

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  const updateFilter = <K extends keyof FlightFilters>(key: K, value: FlightFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleArrayFilter = (key: 'stops' | 'airlines' | 'cabinClasses', value: string | number) => {
    const current = filters[key] as (string | number)[];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    updateFilter(key, updated as any);
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm">
      {/* Header with Sort and Toggle */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
                {isOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="text-muted-foreground hover:text-foreground gap-1"
            >
              <X className="w-3 h-3" />
              Clear all
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={(v) => onSortChange(v as SortOption)}>
            <SelectTrigger className="w-[180px] h-9 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {sortOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Collapsible Filter Content */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent>
          <div className="px-4 pb-4 pt-2 border-t border-border space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Price Range */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Price Range</Label>
                <div className="px-2">
                  <Slider
                    min={filterOptions.minPrice}
                    max={filterOptions.maxPrice}
                    step={10}
                    value={[filters.priceRange[0], filters.priceRange[1]]}
                    onValueChange={(value) => updateFilter('priceRange', [value[0], value[1]])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-2">
                    <span>${filters.priceRange[0]}</span>
                    <span>${filters.priceRange[1]}</span>
                  </div>
                </div>
              </div>

              {/* Stops */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Stops</Label>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.stops.map(stops => (
                    <label
                      key={stops}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-colors",
                        filters.stops.includes(stops)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:border-primary/50"
                      )}
                    >
                      <Checkbox
                        checked={filters.stops.includes(stops)}
                        onCheckedChange={() => toggleArrayFilter('stops', stops)}
                        className="sr-only"
                      />
                      <span className="text-sm">
                        {stops === 0 ? 'Non-stop' : `${stops} stop${stops > 1 ? 's' : ''}`}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Airlines */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Airlines</Label>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.airlines.map(airline => (
                    <label
                      key={airline}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-colors",
                        filters.airlines.includes(airline)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:border-primary/50"
                      )}
                    >
                      <Checkbox
                        checked={filters.airlines.includes(airline)}
                        onCheckedChange={() => toggleArrayFilter('airlines', airline)}
                        className="sr-only"
                      />
                      <span className="text-sm">{carriers[airline] || airline}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Cabin Class */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Cabin Class</Label>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.cabinClasses.map(cabin => (
                    <label
                      key={cabin}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-colors",
                        filters.cabinClasses.includes(cabin)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:border-primary/50"
                      )}
                    >
                      <Checkbox
                        checked={filters.cabinClasses.includes(cabin)}
                        onCheckedChange={() => toggleArrayFilter('cabinClasses', cabin)}
                        className="sr-only"
                      />
                      <span className="text-sm capitalize">{cabin.toLowerCase()}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Departure Time */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Departure Time</Label>
                <div className="px-2">
                  <Slider
                    min={0}
                    max={24}
                    step={1}
                    value={[filters.departureTimeRange[0], filters.departureTimeRange[1]]}
                    onValueChange={(value) => updateFilter('departureTimeRange', [value[0], value[1]])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-2">
                    <span>{formatHour(filters.departureTimeRange[0])}</span>
                    <span>{formatHour(filters.departureTimeRange[1])}</span>
                  </div>
                </div>
              </div>

              {/* Arrival Time */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Arrival Time</Label>
                <div className="px-2">
                  <Slider
                    min={0}
                    max={24}
                    step={1}
                    value={[filters.arrivalTimeRange[0], filters.arrivalTimeRange[1]]}
                    onValueChange={(value) => updateFilter('arrivalTimeRange', [value[0], value[1]])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-2">
                    <span>{formatHour(filters.arrivalTimeRange[0])}</span>
                    <span>{formatHour(filters.arrivalTimeRange[1])}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// Helper functions for filtering and sorting
export function parseDuration(duration: string): number {
  // PT2H30M -> 150 (minutes)
  const match = duration.match(/PT(\d+H)?(\d+M)?/);
  if (!match) return 0;
  const hours = match[1] ? parseInt(match[1].replace('H', '')) : 0;
  const minutes = match[2] ? parseInt(match[2].replace('M', '')) : 0;
  return hours * 60 + minutes;
}

export function getHourFromTime(dateTime: string): number {
  return new Date(dateTime).getHours();
}

export function applyFiltersAndSort(
  flights: Flight[],
  filters: FlightFilters,
  sortBy: SortOption
): Flight[] {
  // Apply filters
  let filtered = flights.filter(flight => {
    // Price filter
    if (flight.price.total < filters.priceRange[0] || flight.price.total > filters.priceRange[1]) {
      return false;
    }

    // Stops filter
    if (filters.stops.length > 0 && !filters.stops.includes(flight.outbound.stops)) {
      return false;
    }

    // Airlines filter
    if (filters.airlines.length > 0 && !filters.airlines.includes(flight.outbound.carrier)) {
      return false;
    }

    // Cabin class filter
    if (filters.cabinClasses.length > 0 && !filters.cabinClasses.includes(flight.cabinClass)) {
      return false;
    }

    // Departure time filter
    const departureHour = getHourFromTime(flight.outbound.departure.time);
    if (departureHour < filters.departureTimeRange[0] || departureHour > filters.departureTimeRange[1]) {
      return false;
    }

    // Arrival time filter
    const arrivalHour = getHourFromTime(flight.outbound.arrival.time);
    if (arrivalHour < filters.arrivalTimeRange[0] || arrivalHour > filters.arrivalTimeRange[1]) {
      return false;
    }

    return true;
  });

  // Apply sorting
  filtered.sort((a, b) => {
    switch (sortBy) {
      case 'price-asc':
        return a.price.total - b.price.total;
      case 'price-desc':
        return b.price.total - a.price.total;
      case 'duration-asc':
        return parseDuration(a.outbound.duration) - parseDuration(b.outbound.duration);
      case 'duration-desc':
        return parseDuration(b.outbound.duration) - parseDuration(a.outbound.duration);
      case 'stops-asc':
        return a.outbound.stops - b.outbound.stops;
      case 'departure-asc':
        return new Date(a.outbound.departure.time).getTime() - new Date(b.outbound.departure.time).getTime();
      case 'departure-desc':
        return new Date(b.outbound.departure.time).getTime() - new Date(a.outbound.departure.time).getTime();
      default:
        return 0;
    }
  });

  return filtered;
}

export function getDefaultFilters(flights: Flight[]): FlightFilters {
  if (flights.length === 0) {
    return {
      priceRange: [0, 10000],
      stops: [],
      airlines: [],
      cabinClasses: [],
      departureTimeRange: [0, 24],
      arrivalTimeRange: [0, 24],
    };
  }

  const prices = flights.map(f => f.price.total);
  return {
    priceRange: [Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))],
    stops: [],
    airlines: [],
    cabinClasses: [],
    departureTimeRange: [0, 24],
    arrivalTimeRange: [0, 24],
  };
}
