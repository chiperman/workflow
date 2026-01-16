/**
 * 热力图日历计算函数
 *
 * 纯函数，用于生成年度日期数组、按周分组、计算月份标签等。
 */

export const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * 生成指定年份的完整日期数组 (Jan 1 - Dec 31)
 */
export function generateYearDays(year: number): string[] {
  const result: string[] = [];
  const start = new Date(year, 0, 1); // Jan 1st
  const end = new Date(year, 11, 31); // Dec 31st

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    // Manually format to YYYY-MM-DD using local time to avoid UTC timezone shifts
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
export function groupByWeeks(dates: string[]): string[][] {
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

export interface MonthLabel {
  name: string;
  weekIndex: number;
}

/**
 * 获取月份标签及其在网格中的起始位置
 */
export function getMonthLabels(weeks: string[][]): MonthLabel[] {
  const labels: MonthLabel[] = [];
  let lastMonth = -1;

  weeks.forEach((week, weekIndex) => {
    const firstValidDate = week.find(d => d !== '');
    if (firstValidDate) {
      const month = new Date(firstValidDate).getMonth();
      if (month !== lastMonth) {
        labels.push({ name: MONTHS[month], weekIndex });
        lastMonth = month;
      }
    }
  });

  // Remove duplicate Jan label at year boundary
  if (labels.length > 1 && labels[0].name === labels[labels.length - 1].name) {
    labels.pop();
  }

  return labels;
}

/**
 * Format date for tooltip (e.g., "Jan 1st", "May 20th")
 */
export function formatDateForTooltip(dateStr: string): string {
  const date = new Date(dateStr);
  const month = MONTHS[date.getMonth()];
  const day = date.getDate();

  let suffix = 'th';
  if (day % 10 === 1 && day !== 11) suffix = 'st';
  else if (day % 10 === 2 && day !== 12) suffix = 'nd';
  else if (day % 10 === 3 && day !== 13) suffix = 'rd';

  return `${month} ${day}${suffix}`;
}
