import { HEATMAP_CONFIG } from '@/config/constants';
import { getColorClass } from '@/lib/heatmap-utils';
import { cn } from '@/lib/utils';
import type { HeatmapDay } from '@/types';
import { memo, useEffect, useState, useMemo, useRef, useCallback } from 'react';

interface MemoizedCellProps {
  date: string;
  dayData: HeatmapDay | undefined;
  globalIndex: number;
  isLoading: boolean;
  onHover: (day: HeatmapDay, rect: DOMRect) => void;
}

// 基础格子布局样式 (共享)
const CELL_BASE_CLASS = 'w-full aspect-square rounded-[2px]';
const MemoizedCell = memo(
  function MemoizedCell({ date, dayData, globalIndex, isLoading, onHover }: MemoizedCellProps) {
    const [hasCompletedReveal, setHasCompletedReveal] = useState(false);
    const cellRef = useRef<HTMLDivElement>(null);

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

    const tooltipData = useMemo(
      () =>
        dayData || {
          date,
          success_count: 0,
          failure_count: 0,
          services: {},
        },
      [dayData, date]
    );

    const colorClass = getColorClass(date, dayData);

    const handleMouseEnter = useCallback(() => {
      if (isLoading) return;
      if (cellRef.current) {
        onHover(tooltipData, cellRef.current.getBoundingClientRect());
      }
    }, [isLoading, onHover, tooltipData]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (cellRef.current) {
            onHover(tooltipData, cellRef.current.getBoundingClientRect());
          }
        }
      },
      [onHover, tooltipData]
    );

    const ariaLabel = useMemo(() => {
      const successCount = dayData?.success_count ?? 0;
      const failureCount = dayData?.failure_count ?? 0;
      return `${date}: ${successCount} successes, ${failureCount} failures`;
    }, [date, dayData]);

    return (
      <div
        ref={cellRef}
        role="gridcell"
        tabIndex={0}
        aria-label={isLoading ? `${date}: loading activity` : ariaLabel}
        onMouseEnter={handleMouseEnter}
        onKeyDown={handleKeyDown}
        className={cn(
          CELL_BASE_CLASS,
          isLoading
            ? 'animate-shimmer cursor-default'
            : 'cursor-pointer heatmap-cell focus:outline-none focus:ring-2 focus:ring-[#d97757] focus:ring-offset-1',
          !isLoading && (!hasCompletedReveal ? 'is-revealing' : 'is-ready'),
          !isLoading && colorClass
        )}
        style={{
          animationDelay: isLoading
            ? `${(globalIndex % 12) * 0.04}s`
            : !hasCompletedReveal
              ? `${delay}ms`
              : undefined,
        }}
      />
    );
  },
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;

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
  isLoading?: boolean;
  allServices?: { service: string; created_at: string }[];
  onHover: (day: HeatmapDay, rect: DOMRect) => void;
  onMouseLeave: () => void;
}

export function HeatmapGrid({
  weeks,
  days,
  dataMap,
  isLoading = false,
  onHover,
  onMouseLeave,
}: HeatmapGridProps) {
  const dayIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    days.forEach((d, i) => map.set(d, i));
    return map;
  }, [days]);

  const gridKey = useMemo(() => {
    return days[0] || 'default';
  }, [days]);

  return (
    <div
      className="relative group/grid w-full flex-1"
      onMouseLeave={onMouseLeave}
      role="grid"
      aria-label="Activity heatmap"
    >
      <div
        key={gridKey}
        className="grid gap-[3px] w-full"
        style={{
          gridTemplateColumns: `repeat(${weeks.length}, 1fr)`,
        }}
        role="rowgroup"
      >
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-[3px]" role="row">
            {week.map((date, dayIndex) => {
              const dayData = dataMap.get(date);
              const globalIndex = dayIndexMap.get(date) ?? 0;

              if (!date) {
                return (
                  <div
                    key={`pad-${weekIndex}-${dayIndex}`}
                    className={`${CELL_BASE_CLASS} bg-transparent`}
                    role="gridcell"
                    aria-hidden="true"
                  />
                );
              }

              return (
                <MemoizedCell
                  key={date}
                  date={date}
                  dayData={dayData}
                  globalIndex={globalIndex}
                  isLoading={isLoading}
                  onHover={onHover}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
