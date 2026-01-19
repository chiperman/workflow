import { HEATMAP_COLORS } from '@/config/constants';

interface HeatmapYearSelectorProps {
  years: number[];
  selectedYear: number;
  loading: boolean;
  onSelectYear: (year: number) => void;
}

export function HeatmapYearSelector({
  years,
  selectedYear,
  loading,
  onSelectYear,
}: HeatmapYearSelectorProps) {
  return (
    <div className="heatmap-years-sidebar flex flex-wrap gap-2 mt-4 md:absolute md:top-0 md:-right-20 md:mt-0 md:flex-col md:gap-1">
      {years.map(year => (
        <button
          key={year}
          onClick={() => onSelectYear(year)}
          className={`heatmap-year-btn px-4 py-2 md:px-3 md:py-1 text-sm md:text-right transition-colors font-serif rounded-md md:rounded-none ${
            year === selectedYear
              ? 'font-medium bg-gray-100 md:bg-transparent'
              : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50 md:hover:bg-transparent'
          }`}
          disabled={loading}
          style={{
            fontFamily: 'var(--font-serif)',
            color: year === selectedYear ? HEATMAP_COLORS.ACTIVE_YEAR : undefined,
          }}
        >
          {year}
        </button>
      ))}
    </div>
  );
}
