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
    <div className="heatmap-years-sidebar md:absolute md:top-0 md:-right-20 mt-4 md:mt-0 flex md:flex-col gap-1 flex-wrap">
      {years.map(year => (
        <button
          key={year}
          onClick={() => onSelectYear(year)}
          className={`heatmap-year-btn px-3 py-1 text-sm text-right transition-colors font-serif ${
            year === selectedYear ? 'font-medium' : 'text-gray-400 hover:text-gray-900'
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
