import { HEATMAP_COLORS } from '@/config/constants';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeatmapYearSelectorProps {
  years: number[];
  selectedYear: number;
  loading: boolean;
  onSelectYear: (year: number) => void;
  yearsLoaded?: boolean;
}

export function HeatmapYearSelector({
  years,
  selectedYear,
  loading,
  onSelectYear,
  yearsLoaded = true,
}: HeatmapYearSelectorProps) {
  // Find current index to determine if we can go prev/next
  // availableYears are typically sorted descending: [2026, 2025, 2024]
  const currentIndex = years.indexOf(selectedYear);
  const hasNext = currentIndex > 0; // Newer year (smaller index)
  const hasPrev = currentIndex < years.length - 1; // Older year (larger index)

  const handleNext = () => {
    if (hasNext) onSelectYear(years[currentIndex - 1]);
  };

  const handlePrev = () => {
    if (hasPrev) onSelectYear(years[currentIndex + 1]);
  };

  if (!yearsLoaded && years.length === 0) return null;

  return (
    <div className="flex items-center gap-3 select-none">
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePrev}
        disabled={loading || !hasPrev}
        aria-label="Previous Year"
        className="h-8 w-8 text-[#888888] hover:text-[#191919] hover:bg-white hover:border-[#d97757]/30 border border-transparent transition-all duration-300 disabled:opacity-30 p-0"
      >
        <ChevronLeft className="w-3.5 h-3.5 stroke-[2]" />
      </Button>

      <span
        className="text-base font-serif font-medium tracking-tight min-w-[3rem] text-center"
        style={{ color: HEATMAP_COLORS.ACTIVE_YEAR }}
      >
        {selectedYear}
      </span>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleNext}
        disabled={loading || !hasNext}
        aria-label="Next Year"
        className="h-8 w-8 text-[#888888] hover:text-[#191919] hover:bg-white hover:border-[#d97757]/30 border border-transparent transition-all duration-300 disabled:opacity-30 p-0"
      >
        <ChevronRight className="w-3.5 h-3.5 stroke-[2]" />
      </Button>
    </div>
  );
}
