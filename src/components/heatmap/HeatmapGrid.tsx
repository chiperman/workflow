import { HeatmapTooltip } from '@/components/heatmap/HeatmapTooltip';
import { HEATMAP_CONFIG } from '@/config/constants';
import { getColorClass } from '@/lib/heatmap-utils';
import type { HeatmapDay } from '@/types';
import { memo, useEffect, useMemo, useState } from 'react';

interface MemoizedCellProps {
  date: string;
  dayData: HeatmapDay | undefined;
  globalIndex: number;
  /** 是否为首次加载（播放 fade-in 动画） */
  isInitialLoad: boolean;
}

/**
 * 使用 memo 优化的单个格子组件
 * - 首次加载时播放 fade-in 动画
 * - 刷新时保持静止，颜色通过 CSS transition 自然过渡
 */
const MemoizedCell = memo(
  function MemoizedCell({ date, dayData, globalIndex, isInitialLoad }: MemoizedCellProps) {
    // 使用 state 追踪动画状态，初始值基于 isInitialLoad
    const [hasAnimated, setHasAnimated] = useState(!isInitialLoad);

    // 动画完成后标记
    useEffect(() => {
      if (isInitialLoad && !hasAnimated) {
        const timer = setTimeout(
          () => {
            setHasAnimated(true);
          },
          globalIndex * HEATMAP_CONFIG.ANIMATION_INTERVAL + 300
        );
        return () => clearTimeout(timer);
      }
    }, [isInitialLoad, hasAnimated, globalIndex]);

    // 只有首次加载且尚未播放过动画时才添加动画 class
    const shouldAnimate = isInitialLoad && !hasAnimated;

    const cell = (
      <div
        className={`heatmap-cell cursor-pointer ${getColorClass(date, dayData)} ${
          shouldAnimate ? 'animate-fade-in' : ''
        }`}
        style={{
          visibility: 'visible',
          animationDelay: shouldAnimate
            ? `${globalIndex * HEATMAP_CONFIG.ANIMATION_INTERVAL}ms`
            : undefined,
        }}
      />
    );

    const tooltipData = dayData || {
      date,
      success_count: 0,
      failure_count: 0,
      services: {},
    };

    return <HeatmapTooltip day={tooltipData}>{cell}</HeatmapTooltip>;
  },
  // 自定义比较函数：只在数据变化时重渲染
  (prevProps, nextProps) => {
    // 比较 dayData（触发颜色变化）
    const prevDay = prevProps.dayData;
    const nextDay = nextProps.dayData;
    if (!prevDay && !nextDay) return true;
    if (!prevDay || !nextDay) return false;
    return (
      prevDay.success_count === nextDay.success_count &&
      prevDay.failure_count === nextDay.failure_count
    );
  }
);

interface HeatmapGridProps {
  weeks: string[][];
  days: string[];
  dataMap: Map<string, HeatmapDay>;
  /** 是否为首次加载（播放 fade-in 动画） */
  isInitialLoad: boolean;
}

export function HeatmapGrid({ weeks, days, dataMap, isInitialLoad }: HeatmapGridProps) {
  // Create a map for quick lookup of day index (0-365)
  const dayIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    days.forEach((d, i) => map.set(d, i));
    return map;
  }, [days]);

  return (
    <div
      className="heatmap-grid"
      style={{
        gridTemplateColumns: `repeat(${weeks.length}, 1fr)`,
      }}
    >
      {weeks.map((week, weekIndex) => (
        <div key={weekIndex} className="heatmap-week">
          {week.map((date, dayIndex) => {
            if (!date) {
              // 空白占位格子
              return (
                <div key={`empty-${weekIndex}-${dayIndex}`}>
                  <div className="heatmap-cell" style={{ visibility: 'hidden' }} />
                </div>
              );
            }

            const globalIndex = dayIndexMap.get(date) ?? 0;
            const day = dataMap.get(date);

            return (
              <MemoizedCell
                key={date}
                date={date}
                dayData={day}
                globalIndex={globalIndex}
                isInitialLoad={isInitialLoad}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
