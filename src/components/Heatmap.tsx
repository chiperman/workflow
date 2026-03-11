import { HeatmapGrid } from '@/components/heatmap/HeatmapGrid';
import { HeatmapLegend } from '@/components/heatmap/HeatmapLegend';
import { HeatmapYearSelector } from '@/components/heatmap/HeatmapYearSelector';
import { SWR_CONFIG } from '@/config/swr';
import { generateYearDays, getMonthLabels, groupByWeeks, WEEKDAYS } from '@/lib/heatmap-calendar';
import type { HeatmapData, YearsData } from '@/types';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

/**
 * GitHub 风格的签到热力图组件 - 完全基于 Tailwind Utility Classes
 */
export function Heatmap() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data: yearsData, isLoading: yearsLoading } = useSWR<YearsData>(
    '/api/stats/heatmap/years',
    fetcher,
    { ...SWR_CONFIG, keepPreviousData: true }
  );

  const availableYears =
    yearsData?.success && yearsData.years ? yearsData.years : [new Date().getFullYear()];

  const {
    data: heatmapResponse,
    isLoading: loading,
    error: fetchError,
  } = useSWR<HeatmapData>(`/api/stats/heatmap?year=${selectedYear}`, fetcher, {
    ...SWR_CONFIG,
    keepPreviousData: true,
  });

  const data = useMemo(
    () => (heatmapResponse?.success && heatmapResponse.data ? heatmapResponse.data : []),
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
  const dataMap = useMemo(() => new Map(data.map(d => [d.date, d])), [data]);

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

  return (
    <Tooltip.Provider disableHoverableContent>
      <div className="relative">
        <div className="relative">
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
                />
              </div>

              {/* Legend & Error */}
              <HeatmapLegend error={error} />
            </div>
          </div>

          {/* Year Selector */}
          <HeatmapYearSelector
            years={availableYears}
            selectedYear={selectedYear}
            loading={loading}
            onSelectYear={setSelectedYear}
            yearsLoaded={!yearsLoading}
          />
        </div>
      </div>
    </Tooltip.Provider>
  );
}
