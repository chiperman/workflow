'use client';

import { useCallback, useEffect, useState } from 'react';

interface HeatmapDay {
  date: string;
  success_count: number;
  failure_count: number;
  services: Record<string, 'success' | 'failure'>;
}

interface HeatmapData {
  success: boolean;
  data?: HeatmapDay[];
  year?: number;
  error?: string;
}

interface YearsData {
  success: boolean;
  years?: number[];
  error?: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * GitHub 风格的签到热力图组件
 */
export function Heatmap() {
  const [data, setData] = useState<HeatmapDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ day: HeatmapDay; x: number; y: number } | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([new Date().getFullYear()]);

  // 获取有数据的年份列表
  useEffect(() => {
    async function fetchYears() {
      try {
        const res = await fetch('/api/stats/heatmap/years');
        const json: YearsData = await res.json();
        if (json.success && json.years) {
          setAvailableYears(json.years);
        }
      } catch {
        // 忽略错误，使用默认当前年份
      }
    }
    fetchYears();
  }, []);

  // 获取指定年份的热力图数据
  const fetchHeatmapData = useCallback(async (year: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stats/heatmap?year=${year}`);
      const json: HeatmapData = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        setError(null);
      } else {
        setError(json.error || 'Failed to load heatmap data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHeatmapData(selectedYear);
  }, [selectedYear, fetchHeatmapData]);

  // 生成选中年份的日期数组 (Jan 1 - Dec 31)
  const days = generateYearDays(selectedYear);
  const dataMap = new Map(data.map(d => [d.date, d]));

  // 计算颜色等级 (Simplified 3-State Logic)
  const getColorClass = (date: string): string => {
    if (!date) return 'heatmap-level-0';
    const day = dataMap.get(date);
    if (!day) return 'heatmap-level-0';

    // Priority 1: Failure (Red) - If ANY service failed eventually, the day is imperfect.
    if (day.failure_count > 0) return 'heatmap-level-failure';

    // Priority 2: Success (Green) - Only if NO failures and AT LEAST one success.
    if (day.success_count > 0) return 'heatmap-level-success';

    // Default: Empty (Grey)
    return 'heatmap-level-0';
  };

  const handleMouseEnter = (e: React.MouseEvent, date: string) => {
    // If no data exists for this date, default to 0 counts
    const day = dataMap.get(date) || {
      date,
      success_count: 0,
      failure_count: 0,
      services: {},
    };

    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({ day, x: rect.left + rect.width / 2, y: rect.top });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  // 错误时显示错误信息
  if (error) {
    return (
      <div className="heatmap-container">
        <div className="heatmap-error">{error}</div>
      </div>
    );
  }

  // 始终渲染格子结构，数据加载完成后自动更新颜色

  // 按周分组
  const weeks = groupByWeeks(days);

  // 计算月份标签位置
  const monthLabels = getMonthLabels(weeks, days);

  return (
    <div className="heatmap-container">
      <div className="heatmap-layout">
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
              <div
                className="heatmap-grid"
                style={{
                  gridTemplateColumns: `repeat(${weeks.length}, 1fr)`,
                }}
              >
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="heatmap-week">
                    {week.map((date, dayIndex) => (
                      <div
                        key={date || `empty-${weekIndex}-${dayIndex}`}
                        className={`heatmap-cell ${date ? getColorClass(date) : 'heatmap-level-0'}`}
                        onMouseEnter={e => date && handleMouseEnter(e, date)}
                        onMouseLeave={handleMouseLeave}
                        style={{ visibility: date ? 'visible' : 'hidden' }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* 图例 */}
            <div className="heatmap-footer">
              <div className="heatmap-legend">
                <div className="heatmap-cell heatmap-level-0" />
                <span>No check-ins</span>

                <div
                  className="heatmap-cell heatmap-level-success"
                  style={{ marginLeft: '12px' }}
                />
                <span>Success</span>

                <div
                  className="heatmap-cell heatmap-level-failure"
                  style={{ marginLeft: '12px' }}
                />
                <span>Failure</span>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：年份选择器 */}
        <div className="heatmap-years-sidebar">
          {availableYears.map(year => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`heatmap-year-btn ${year === selectedYear ? 'active' : ''}`}
              disabled={loading}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      {tooltip && (
        <div
          className="heatmap-tooltip"
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y - 10,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="tooltip-date">
            {(() => {
              const { success_count, failure_count, date } = tooltip.day;
              const total = success_count + failure_count;
              const dateText = formatDateForTooltip(date);

              if (total === 0) {
                return `No check-ins on ${dateText}`;
              }

              const parts: string[] = [];
              if (success_count > 0) {
                parts.push(`${success_count} successful`);
              }
              if (failure_count > 0) {
                parts.push(`${failure_count} failed`);
              }

              const description = parts.join(', ');
              const unit = total === 1 ? 'check-in' : 'check-ins';

              return `${description} ${unit} on ${dateText}`;
            })()}
          </div>
          {Object.entries(tooltip.day.services).filter(([, status]) => status === 'failure')
            .length > 0 && (
            <div className="tooltip-services mt-1 text-red-300">
              Failed:{' '}
              {Object.entries(tooltip.day.services)
                .filter(([, status]) => status === 'failure')
                .map(([service]) => service.charAt(0).toUpperCase() + service.slice(1)) // Capitalize
                .join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * 生成指定年份的完整日期数组 (Jan 1 - Dec 31)
 */
function generateYearDays(year: number): string[] {
  const result: string[] = [];
  const start = new Date(year, 0, 1); // Jan 1st
  const end = new Date(year, 11, 31); // Dec 31st

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    // Manually format to YYYY-MM-DD using local time to avoid UTC timezone shifts
    // (e.g., Jan 1st 00:00 local becoming Dec 31st UTC)
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    result.push(`${y}-${m}-${day}`);
  }

  return result;
}

/**
 * 将日期按周分组
 */
function groupByWeeks(dates: string[]): string[][] {
  const weeks: string[][] = [];
  let currentWeek: string[] = [];

  const firstDate = new Date(dates[0]);
  const firstDayOfWeek = firstDate.getDay();

  // 填充第一周的空位
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push('');
  }

  for (const date of dates) {
    currentWeek.push(date);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return weeks;
}

/**
 * 获取月份标签及其在网格中的起始位置
 */
function getMonthLabels(weeks: string[][], _days: string[]): { name: string; weekIndex: number }[] {
  const labels: { name: string; weekIndex: number }[] = [];
  let lastMonth = -1;

  weeks.forEach((week, weekIndex) => {
    // 找到这一周第一个有效日期
    const firstValidDate = week.find(d => d !== '');
    if (firstValidDate) {
      const month = new Date(firstValidDate).getMonth();
      if (month !== lastMonth) {
        labels.push({ name: MONTHS[month], weekIndex });
        lastMonth = month;
      }
    }
  });

  // Remove the last label if it's the same as the first one (wrap-around year)
  // causing "Jan ... Jan" visual redundancy
  if (labels.length > 1 && labels[0].name === labels[labels.length - 1].name) {
    labels.pop();
  }

  return labels;
}

/**
 * Format date for tooltip (e.g., "Jan 1st", "May 20th")
 */
function formatDateForTooltip(dateStr: string): string {
  const date = new Date(dateStr);
  const month = MONTHS[date.getMonth()];
  const day = date.getDate();

  let suffix = 'th';
  if (day % 10 === 1 && day !== 11) suffix = 'st';
  else if (day % 10 === 2 && day !== 12) suffix = 'nd';
  else if (day % 10 === 3 && day !== 13) suffix = 'rd';

  return `${month} ${day}${suffix}`;
}
