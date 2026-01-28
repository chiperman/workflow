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
 *
 * 渲染行为：
 * - 首次加载/切换年份：播放 fade-in 顺序动画
 * - 刷新数据：格子保持静止，颜色通过 CSS transition 平滑过渡
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

  // 获取指定年份的热力图数据 (使用 SWR 缓存，keepPreviousData 避免刷新时格子消失)
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

  // 生成选中年份的日期数组 (Jan 1 - Dec 31)，使用 useMemo 缓存
  const days = useMemo(() => generateYearDays(selectedYear), [selectedYear]);
  const dataMap = useMemo(() => new Map(data.map(d => [d.date, d])), [data]);

  // 追踪已完成初始动画的年份，避免刷新时重复播放
  const [animatedYears, setAnimatedYears] = useState<Set<number>>(new Set());

  // 判断当前年份是否需要播放初始动画
  const isInitialLoad = !animatedYears.has(selectedYear) && data.length > 0;

  // 动画完成后记录该年份
  useEffect(() => {
    if (data.length > 0 && !animatedYears.has(selectedYear)) {
      // 等待动画完成后标记
      const timer = setTimeout(() => {
        setAnimatedYears(prev => new Set(prev).add(selectedYear));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [data.length, selectedYear, animatedYears]);

  // 按周分组
  const weeks = groupByWeeks(days);
  const monthLabels = getMonthLabels(weeks);

  return (
    <Tooltip.Provider disableHoverableContent>
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
                <HeatmapGrid
                  weeks={weeks}
                  days={days}
                  dataMap={dataMap}
                  isInitialLoad={isInitialLoad}
                />
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
