import { HeatmapTooltip } from '@/components/heatmap/HeatmapTooltip';
import { HEATMAP_CONFIG } from '@/config/constants';
import { getColorClass } from '@/lib/heatmap-utils';
import type { HeatmapDay } from '@/types';
import { memo, useEffect, useMemo, useState } from 'react';

interface MemoizedCellProps {
  date: string;
  dayData: HeatmapDay | undefined;
  globalIndex: number;
  isInitialLoad: boolean;
}

// 基础格子布局样式 (共享)
const CELL_BASE_CLASS = 'w-full aspect-square rounded-[2px]';

const MemoizedCell = memo(
  function MemoizedCell({ date, dayData, globalIndex, isInitialLoad }: MemoizedCellProps) {
    const [hasAnimated, setHasAnimated] = useState(!isInitialLoad);

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

    const shouldAnimate = isInitialLoad && !hasAnimated;

    const tooltipData = dayData || {
      date,
      success_count: 0,
      failure_count: 0,
      services: {},
    };

    // getColorClass returns things like 'bg-heatmap-level-0'
    const colorClass = getColorClass(date, dayData);

    return (
      <HeatmapTooltip day={tooltipData}>
        <div
          className={`${CELL_BASE_CLASS} cursor-pointer transition-[transform,background-color] duration-75 ease-out ${colorClass} ${
            shouldAnimate ? 'animate-fade-in' : ''
          }`}
          style={{
            visibility: 'visible',
            animationDelay: shouldAnimate
              ? `${globalIndex * HEATMAP_CONFIG.ANIMATION_INTERVAL}ms`
              : undefined,
          }}
        />
      </HeatmapTooltip>
    );
  },
  (prevProps, nextProps) => {
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
  isInitialLoad: boolean;
}

export function HeatmapGrid({ weeks, days, dataMap, isInitialLoad }: HeatmapGridProps) {
  const dayIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    days.forEach((d, i) => map.set(d, i));
    return map;
  }, [days]);

  return (
    <div
      className="grid gap-[3px] flex-1 w-full"
      style={{
        gridTemplateColumns: `repeat(${weeks.length}, 1fr)`,
      }}
    >
      {weeks.map((week, weekIndex) => (
        <div key={weekIndex} className="flex flex-col gap-[3px]">
          {week.map((date, dayIndex) => {
            const dayData = dataMap.get(date);
            const globalIndex = dayIndexMap.get(date) ?? 0;

            if (!date) {
              return (
                <div
                  key={`pad-${weekIndex}-${dayIndex}`}
                  className={`${CELL_BASE_CLASS} bg-transparent`}
                />
              );
            }

            return (
              <MemoizedCell
                key={date}
                date={date}
                dayData={dayData}
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
