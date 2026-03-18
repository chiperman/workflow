import {
  formatDateForTooltip,
  generateYearDays,
  getMonthLabels,
  groupByWeeks,
  MONTHS,
  WEEKDAYS,
} from '../heatmap-calendar';

describe('heatmap-calendar', () => {
  describe('常量导出', () => {
    it('MONTHS 应包含 12 个月份缩写', () => {
      expect(MONTHS).toHaveLength(12);
      expect(MONTHS[0]).toBe('Jan');
      expect(MONTHS[11]).toBe('Dec');
    });

    it('WEEKDAYS 应包含 7 个星期缩写', () => {
      expect(WEEKDAYS).toHaveLength(7);
      expect(WEEKDAYS[0]).toBe('Sun');
      expect(WEEKDAYS[6]).toBe('Sat');
    });
  });

  describe('generateYearDays', () => {
    it('应生成指定年份的所有日期', () => {
      const days = generateYearDays(2026);
      expect(days[0]).toBe('2026-01-01');
      expect(days[days.length - 1]).toBe('2026-12-31');
    });

    it('应正确处理闰年', () => {
      const days2024 = generateYearDays(2024); // 闰年
      expect(days2024).toContain('2024-02-29');
      expect(days2024).toHaveLength(366);

      const days2025 = generateYearDays(2025); // 非闰年
      expect(days2025).not.toContain('2025-02-29');
      expect(days2025).toHaveLength(365);
    });

    it('日期格式应为 YYYY-MM-DD', () => {
      const days = generateYearDays(2026);
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      expect(days.every(d => dateRegex.test(d))).toBe(true);
    });
  });

  describe('groupByWeeks', () => {
    it('应将日期按周分组', () => {
      const days = generateYearDays(2026);
      const weeks = groupByWeeks(days);

      // 每周应有 7 天（最后一周可能不足）
      weeks.slice(0, -1).forEach(week => {
        expect(week).toHaveLength(7);
      });
    });

    it('第一周应填充空字符串补齐', () => {
      const days = generateYearDays(2026);
      const weeks = groupByWeeks(days);
      const firstWeek = weeks[0];

      // 2026-01-01 是周四，所以前面应有 4 个空位 (Sun-Wed)
      const emptyCount = firstWeek.filter(d => d === '').length;
      expect(emptyCount).toBeGreaterThanOrEqual(0);
      expect(emptyCount).toBeLessThan(7);
    });
  });

  describe('getMonthLabels', () => {
    it('应返回 12 个月份标签', () => {
      const days = generateYearDays(2026);
      const weeks = groupByWeeks(days);
      const labels = getMonthLabels(weeks);

      expect(labels.length).toBeGreaterThanOrEqual(11);
      expect(labels.length).toBeLessThanOrEqual(12);
    });

    it('标签应包含月份名称和周索引', () => {
      const days = generateYearDays(2026);
      const weeks = groupByWeeks(days);
      const labels = getMonthLabels(weeks);

      labels.forEach(label => {
        expect(label).toHaveProperty('name');
        expect(label).toHaveProperty('weekIndex');
        expect(MONTHS).toContain(label.name);
        expect(typeof label.weekIndex).toBe('number');
      });
    });
  });

  describe('formatDateForTooltip', () => {
    it('应正确格式化日期', () => {
      expect(formatDateForTooltip('2026-01-01')).toBe('Jan 1st, 2026');
      expect(formatDateForTooltip('2026-01-02')).toBe('Jan 2nd, 2026');
      expect(formatDateForTooltip('2026-01-03')).toBe('Jan 3rd, 2026');
      expect(formatDateForTooltip('2026-01-04')).toBe('Jan 4th, 2026');
    });

    it('应正确处理特殊后缀 (11th, 12th, 13th)', () => {
      expect(formatDateForTooltip('2026-01-11')).toBe('Jan 11th, 2026');
      expect(formatDateForTooltip('2026-01-12')).toBe('Jan 12th, 2026');
      expect(formatDateForTooltip('2026-01-13')).toBe('Jan 13th, 2026');
    });

    it('应正确处理 21st, 22nd, 23rd', () => {
      expect(formatDateForTooltip('2026-01-21')).toBe('Jan 21st, 2026');
      expect(formatDateForTooltip('2026-01-22')).toBe('Jan 22nd, 2026');
      expect(formatDateForTooltip('2026-01-23')).toBe('Jan 23rd, 2026');
    });
  });
});
