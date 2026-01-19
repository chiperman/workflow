import { formatDateForTooltip } from '@/lib/heatmap-calendar';
import type { HeatmapDay } from '@/types';

interface HeatmapTooltipProps {
  day: HeatmapDay;
  x: number;
  y: number;
}

export function HeatmapTooltip({ day, x, y }: HeatmapTooltipProps) {
  const { success_count, failure_count, date } = day;
  const total = success_count + failure_count;
  const dateText = formatDateForTooltip(date);

  let message = '';
  if (total === 0) {
    message = `No check-ins on ${dateText}`;
  } else {
    const parts: string[] = [];
    if (success_count > 0) parts.push(`${success_count} successful`);
    if (failure_count > 0) parts.push(`${failure_count} failed`);

    const description = parts.join(', ');
    const unit = total === 1 ? 'check-in' : 'check-ins';
    message = `${description} ${unit} on ${dateText}`;
  }

  const failedServices = Object.entries(day.services)
    .filter(([, status]) => status === 'failure')
    .map(([service]) => service.charAt(0).toUpperCase() + service.slice(1));

  return (
    <div
      className="heatmap-tooltip"
      style={{
        position: 'fixed',
        left: Math.min(Math.max(x, 10), window.innerWidth - 10), // Prevent overflow
        top: y - 8,
        transform: 'translate(-50%, -100%)',
        pointerEvents: 'none', // Prevent flickering
      }}
    >
      <div className="tooltip-date">{message}</div>
      {failedServices.length > 0 && (
        <div className="tooltip-services mt-1 text-red-300">
          Failed: {failedServices.join(', ')}
        </div>
      )}
    </div>
  );
}
