import { HeatmapTooltip } from '@/components/heatmap/HeatmapTooltip';
import { HEATMAP_CONFIG } from '@/config/constants';
import { getColorClass } from '@/lib/heatmap-utils';
import type { HeatmapDay } from '@/types';
import { useMemo } from 'react';

interface HeatmapGridProps {
  weeks: string[][];
  days: string[];
  dataMap: Map<string, HeatmapDay>;
  loaded: boolean;
}

export function HeatmapGrid({ weeks, days, dataMap, loaded }: HeatmapGridProps) {
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
            const globalIndex = date ? (dayIndexMap.get(date) ?? 0) : 0;
            // Only apply animation class when loaded is true
            const shouldAnimate = date && loaded;
            const day = date ? dataMap.get(date) : undefined;

            const cell = (
              <div
                className={`heatmap-cell ${getColorClass(date, day)} ${
                  shouldAnimate ? 'animate-fade-in' : ''
                }`}
                style={{
                  visibility: date ? 'visible' : 'hidden',
                  // Use constant interval for faster but still sequential appearance
                  animationDelay: shouldAnimate
                    ? `${globalIndex * HEATMAP_CONFIG.ANIMATION_INTERVAL}ms`
                    : '0ms',
                  // Ensure opacity is 0 before animation starts
                  opacity: date && !shouldAnimate ? 0 : undefined,
                }}
              />
            );

            if (date) {
              const dayData = day || {
                date,
                success_count: 0,
                failure_count: 0,
                services: {},
              };
              return (
                <HeatmapTooltip key={date} day={dayData}>
                  {cell}
                </HeatmapTooltip>
              );
            }

            return <div key={`empty-${weekIndex}-${dayIndex}`}>{cell}</div>;
          })}
        </div>
      ))}
    </div>
  );
}
