import { HEATMAP_COLORS } from '@/config/constants';

interface HeatmapLegendProps {
  error?: string | null;
}

export function HeatmapLegend({ error }: HeatmapLegendProps) {
  return (
    <div className="mt-4 flex justify-between items-center text-[11px] text-[#888]">
      <div>{error && <span className="text-red-400">Offline: Data sync failed</span>}</div>
      <div className="flex items-center gap-4" role="list" aria-label="Heatmap legend">
        <div className="flex items-center gap-1.5" role="listitem">
          <div
            className={`${HEATMAP_COLORS.LEVEL_0} w-2.5 h-2.5 rounded-[2px]`}
            aria-hidden="true"
          />
          <span>No check-ins</span>
        </div>
        <div className="flex items-center gap-1.5" role="listitem">
          <div
            className={`${HEATMAP_COLORS.LEVEL_SUCCESS} w-2.5 h-2.5 rounded-[2px]`}
            aria-hidden="true"
          />
          <span>Success</span>
        </div>
        <div className="flex items-center gap-1.5" role="listitem">
          <div
            className={`${HEATMAP_COLORS.LEVEL_FAILURE} w-2.5 h-2.5 rounded-[2px]`}
            aria-hidden="true"
          />
          <span>Failure</span>
        </div>
      </div>
    </div>
  );
}
