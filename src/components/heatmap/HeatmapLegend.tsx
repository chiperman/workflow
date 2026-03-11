import { HEATMAP_COLORS } from '@/config/constants';

interface HeatmapLegendProps {
  error?: string | null;
}

export function HeatmapLegend({ error }: HeatmapLegendProps) {
  return (
    <div className="mt-4 flex justify-between items-center text-[11px] text-[#888]">
      <div>{error && <span className="text-red-400">Offline: Data sync failed</span>}</div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className={`${HEATMAP_COLORS.LEVEL_0} w-2.5 h-2.5 rounded-[2px]`} />
          <span>No check-ins</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`${HEATMAP_COLORS.LEVEL_SUCCESS} w-2.5 h-2.5 rounded-[2px]`} />
          <span>Success</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`${HEATMAP_COLORS.LEVEL_FAILURE} w-2.5 h-2.5 rounded-[2px]`} />
          <span>Failure</span>
        </div>
      </div>
    </div>
  );
}
