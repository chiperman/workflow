import { HeatmapGrid } from '@/components/heatmap/HeatmapGrid';
import { HeatmapLegend } from '@/components/heatmap/HeatmapLegend';
import { HeatmapTooltipContent } from '@/components/heatmap/HeatmapTooltip';
import { HeatmapYearSelector } from '@/components/heatmap/HeatmapYearSelector';
import { SWR_CONFIG } from '@/config/swr';
import { generateYearDays, getMonthLabels, groupByWeeks, WEEKDAYS } from '@/lib/heatmap-calendar';
import { cn } from '@/lib/utils';
import type { ApiResponse, HeatmapData, HeatmapDay } from '@/types';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

/**
 * GitHub 风格的签到热力图组件 - 完全基于 Tailwind Utility Classes
 */
export function Heatmap() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredDay, setHoveredDay] = useState<HeatmapDay | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const { data: yearsResponse, isLoading: yearsLoading } = useSWR<ApiResponse<{ years: number[] }>>(
    '/api/stats/heatmap/years',
    fetcher,
    { ...SWR_CONFIG, keepPreviousData: true }
  );

  const availableYears =
    yearsResponse?.success && yearsResponse.data?.years
      ? yearsResponse.data.years
      : [new Date().getFullYear()];

  const {
    data: heatmapResponse,
    isLoading: loading,
    error: fetchError,
  } = useSWR<ApiResponse<HeatmapData>>(`/api/stats/heatmap?year=${selectedYear}`, fetcher, {
    ...SWR_CONFIG,
    keepPreviousData: true,
  });

  const data = useMemo(
    () =>
      heatmapResponse?.success && heatmapResponse.data?.heatmap ? heatmapResponse.data.heatmap : [],
    [heatmapResponse]
  );

  const services = useMemo(
    () =>
      heatmapResponse?.success && heatmapResponse.data?.services
        ? heatmapResponse.data.services
        : [],
    [heatmapResponse]
  );

  const error = fetchError
    ? fetchError instanceof Error
      ? fetchError.message
      : 'Unknown error'
    : heatmapResponse && !heatmapResponse.success
      ? heatmapResponse.error
      : null;

  const days = useMemo(() => generateYearDays(selectedYear), [selectedYear]);
  const dataMap = useMemo(() => {
    const map = new Map<string, HeatmapDay>();
    data.forEach((d: HeatmapDay) => map.set(d.date, d));
    return map;
  }, [data]);

  const [animatedYears, setAnimatedYears] = useState<Set<number>>(new Set());
  const isInitialLoad = !animatedYears.has(selectedYear) && data.length > 0;

  useEffect(() => {
    if (data.length > 0 && !animatedYears.has(selectedYear)) {
      const timer = setTimeout(() => {
        setAnimatedYears(prev => new Set(prev).add(selectedYear));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [data.length, selectedYear, animatedYears]);

  const weeks = groupByWeeks(days);
  const monthLabels = getMonthLabels(weeks);

  const handleCellHover = useCallback((day: HeatmapDay, rect: DOMRect) => {
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      setHoveredDay(day);
      setTooltipPos({
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top,
      });
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredDay(null);
  }, []);

  return (
    <Tooltip.Provider>
      <div className="relative w-full" ref={containerRef}>
        {/* Year Selector Header */}
        <div className="flex justify-end mb-3">
          <HeatmapYearSelector
            years={availableYears}
            selectedYear={selectedYear}
            loading={loading}
            onSelectYear={setSelectedYear}
            yearsLoaded={!yearsLoading}
          />
        </div>

        {/* Main Heatmap Area */}
        <div className="w-full p-6 bg-white rounded-lg border border-border-custom overflow-x-auto">
          <div className="w-full min-w-[600px]">
            {/* Months Row */}
            <div
              className="grid pl-[36px] w-full box-border mb-2"
              style={{
                gridTemplateColumns: `repeat(${weeks.length}, 1fr)`,
              }}
            >
              {monthLabels.map((label, i) => (
                <span
                  key={i}
                  className="text-[13px] text-[#666] whitespace-nowrap"
                  style={{ gridColumnStart: label.weekIndex + 1 }}
                >
                  {label.name}
                </span>
              ))}
            </div>

            <div className="flex gap-2 w-full">
              {/* Weekdays Column */}
              <div className="flex flex-col justify-between pr-1 shrink-0 w-[28px] pb-1.5">
                {WEEKDAYS.map((day, i) => (
                  <div key={day} className="text-[11px] text-[#666] leading-none text-right">
                    {i % 2 === 1 ? day : ''}
                  </div>
                ))}
              </div>

              {/* Grid */}
              <HeatmapGrid
                weeks={weeks}
                days={days}
                dataMap={dataMap}
                isInitialLoad={isInitialLoad}
                allServices={services}
                onHover={handleCellHover}
                onMouseLeave={handleMouseLeave}
              />
            </div>

            {/* Legend & Error */}
            <HeatmapLegend error={error} />
          </div>
        </div>

        {/* Persistent Smooth Tooltip - Rendered outside of the overflow container */}
        <div
          className={cn(
            'absolute z-50 pointer-events-none transition-all duration-200 ease-out hidden md:block',
            hoveredDay ? 'opacity-100' : 'opacity-0 scale-95 pointer-events-none'
          )}
          style={{
            left: tooltipPos?.x ?? 0,
            top: tooltipPos?.y ?? 0,
            transform: `translate(-50%, calc(-100% - 8px))`,
          }}
        >
          {hoveredDay && (
            <div className="px-3 py-2 text-xs text-white bg-gray-900 rounded-[4px] shadow-xl border border-white/10 backdrop-blur-sm">
              <HeatmapTooltipContent day={hoveredDay} allServices={services} />
              {/* Tooltip Arrow */}
              <div
                className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 
                border-l-[5px] border-l-transparent 
                border-r-[5px] border-r-transparent 
                border-t-[5px] border-t-gray-900"
              />
            </div>
          )}
        </div>
      </div>
    </Tooltip.Provider>
  );
}
