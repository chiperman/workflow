import { HeatmapTooltip } from '@/components/heatmap/HeatmapTooltip';
import { HEATMAP_CONFIG } from '@/config/constants';
import { getColorClass } from '@/lib/heatmap-utils';
import { cn } from '@/lib/utils';
import type { HeatmapDay } from '@/types';
import { memo, useEffect, useState, useMemo } from 'react';

interface MemoizedCellProps {
  date: string;
  dayData: HeatmapDay | undefined;
  globalIndex: number;
  allServices?: { service: string; created_at: string }[];
}

// 基础格子布局样式 (共享)
const CELL_BASE_CLASS = 'w-full aspect-square rounded-[2px]';
const MemoizedCell = memo(
  function MemoizedCell({ date, dayData, globalIndex, allServices }: MemoizedCellProps) {
    const [hasCompletedReveal, setHasCompletedReveal] = useState(false);

    // Timing constants
    const revealDuration = 600; // Match globals.css gridReveal duration
    const delay = globalIndex * HEATMAP_CONFIG.ANIMATION_INTERVAL;

    useEffect(() => {
      // Small buffer to ensure the animation finished rendering before enabling transitions
      const timer = setTimeout(
        () => {
          setHasCompletedReveal(true);
        },
        delay + revealDuration + 50
      );

      return () => clearTimeout(timer);
    }, [delay]);

    const tooltipData = dayData || {
      date,
      success_count: 0,
      failure_count: 0,
      services: {},
    };

    const colorClass = getColorClass(date, dayData);

    return (
      <HeatmapTooltip day={tooltipData} allServices={allServices}>
        <div
          className={cn(
            CELL_BASE_CLASS,
            'cursor-pointer heatmap-cell',
            !hasCompletedReveal ? 'is-revealing' : 'is-ready',
            colorClass
          )}
          style={{
            animationDelay: !hasCompletedReveal ? `${delay}ms` : undefined,
          }}
        />
      </HeatmapTooltip>
    );
  },
  (prevProps, nextProps) => {
    const prevDay = prevProps.dayData;
    const nextDay = nextProps.dayData;
    const prevServices = prevProps.allServices;
    const nextServices = nextProps.allServices;

    if (!prevDay && !nextDay && prevServices === nextServices) return true;
    if (!prevDay || !nextDay || prevServices !== nextServices) return false;

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
  isInitialLoad: boolean; // Keeping for interface, but using internal trigger now
  allServices?: { service: string; created_at: string }[];
}

export function HeatmapGrid({ weeks, days, dataMap, allServices }: HeatmapGridProps) {
  const dayIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    days.forEach((d, i) => map.set(d, i));
    return map;
  }, [days]);

  // Use the cumulative data as a key trigger to re-run animations if desired
  // However, usually we want animation on mount/year-change.
  const gridKey = useMemo(() => {
    return days[0] || 'default';
  }, [days]);

  return (
    <div
      key={gridKey}
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
                allServices={allServices}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
