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
 * GitHub 风格的签到热力图组件
 */
export function Heatmap() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // 获取有数据的年份列表 (使用 SWR 缓存)
  const { data: yearsData, isLoading: yearsLoading } = useSWR<YearsData>(
    '/api/stats/heatmap/years',
    fetcher,
    { ...SWR_CONFIG, keepPreviousData: true }
  );
  const availableYears =
    yearsData?.success && yearsData.years ? yearsData.years : [new Date().getFullYear()];

  // 获取指定年份的热力图数据 (使用 SWR 缓存)
  const {
    data: heatmapResponse,
    isLoading: loading,
    error: fetchError,
  } = useSWR<HeatmapData>(`/api/stats/heatmap?year=${selectedYear}`, fetcher, SWR_CONFIG);

  const data = heatmapResponse?.success && heatmapResponse.data ? heatmapResponse.data : [];
  const error = fetchError
    ? fetchError instanceof Error
      ? fetchError.message
      : 'Unknown error'
    : heatmapResponse && !heatmapResponse.success
      ? heatmapResponse.error
      : null;

  // 生成选中年份的日期数组 (Jan 1 - Dec 31)，使用 useMemo 缓存
  const days = useMemo(() => generateYearDays(selectedYear), [selectedYear]);
  const dataMap = new Map(data.map(d => [d.date, d]));

  // Control animation start to avoid initial render blocking AND wait for data
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setLoaded(true);
    });
    return () => cancelAnimationFrame(timer);
  }, [selectedYear]);

  // 按周分组
  const weeks = groupByWeeks(days);
  const monthLabels = getMonthLabels(weeks);

  return (
    <Tooltip.Provider>
      <div className="heatmap-container">
        <div className="heatmap-layout relative">
          {/* 左侧：热力图主体 */}
          <div className="heatmap-main">
            <div className="heatmap-wrapper">
              {/* 月份标签 */}
              <div
                className="heatmap-months"
                style={{
                  gridTemplateColumns: `repeat(${weeks.length}, 1fr)`,
                }}
              >
                {monthLabels.map((label, i) => (
                  <span
                    key={i}
                    className="heatmap-month-label"
                    style={{ gridColumnStart: label.weekIndex + 1 }}
                  >
                    {label.name}
                  </span>
                ))}
              </div>

              <div className="heatmap-body">
                {/* 星期标签 */}
                <div className="heatmap-weekdays">
                  {WEEKDAYS.map((day, i) => (
                    <div key={day} className="heatmap-weekday-label">
                      {i % 2 === 1 ? day : ''}
                    </div>
                  ))}
                </div>

                {/* 热力图网格 */}
                <HeatmapGrid weeks={weeks} days={days} dataMap={dataMap} loaded={loaded} />
              </div>

              {/* 底部：图例 (右对齐) & 错误提示 */}
              <HeatmapLegend error={error} />
            </div>
          </div>

          {/* 右侧：年份选择器 */}
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
