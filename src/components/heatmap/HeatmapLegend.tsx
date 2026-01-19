import { HEATMAP_COLORS } from '@/config/constants';

interface HeatmapLegendProps {
  error?: string | null;
}

export function HeatmapLegend({ error }: HeatmapLegendProps) {
  return (
    <div className="heatmap-footer mt-4 flex justify-between items-center text-xs text-gray-400">
      <div className="heatmap-status">
        {error && <span className="text-red-400">Offline: Data sync failed</span>}
      </div>
      <div className="heatmap-legend flex items-center gap-3">
        <div className="flex items-center gap-1">
          <div className={`heatmap-cell ${HEATMAP_COLORS.LEVEL_0} w-3 h-3 rounded-sm`} />
          <span>No check-ins</span>
        </div>
        <div className="flex items-center gap-1">
          <div className={`heatmap-cell ${HEATMAP_COLORS.LEVEL_SUCCESS} w-3 h-3 rounded-sm`} />
          <span>Success</span>
        </div>

        <div className="flex items-center gap-1">
          <div className={`heatmap-cell ${HEATMAP_COLORS.LEVEL_FAILURE} w-3 h-3 rounded-sm`} />
          <span>Failure</span>
        </div>
      </div>
    </div>
  );
}
