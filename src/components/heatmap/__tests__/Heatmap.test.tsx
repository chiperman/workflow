import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SWRConfig } from 'swr';
import { Heatmap } from '../../Heatmap';

// Mock the heatmap-calendar module
jest.mock('@/lib/heatmap-calendar', () => ({
  MONTHS: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  WEEKDAYS: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  generateYearDays: jest.fn(() => {
    // 返回简化的日期数组用于测试
    const days: string[] = [];
    for (let i = 1; i <= 7; i++) {
      days.push(`2026-01-0${i}`);
    }
    return days;
  }),
  groupByWeeks: jest.fn((days: string[]) => [days]),
  getMonthLabels: jest.fn(() => [{ name: 'Jan', weekIndex: 0 }]),
  formatDateForTooltip: jest.fn((date: string) => date),
}));

// Wrapper to disable SWR caching in tests
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>{children}</SWRConfig>
);

describe('Heatmap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('应正确渲染热力图容器', async () => {
    // Mock years API
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/years')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { years: [2026] } }),
        });
      }
      // Mock heatmap data API
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: [
              {
                date: '2026-01-01',
                success_count: 3,
                failure_count: 0,
                services: { supabase: 'success', glados: 'success' },
              },
            ],
          }),
      });
    });

    render(<Heatmap />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByText('Jan')).toBeInTheDocument();
    });
  });

  it('应渲染图例', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] }),
    });

    render(<Heatmap />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByText('No check-ins')).toBeInTheDocument();
      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByText('Failure')).toBeInTheDocument();
    });
  });

  it('应渲染年份按钮', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/years')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { years: [2026, 2025] } }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });
    });

    render(<Heatmap />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '2026' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '2025' })).toBeInTheDocument();
    });
  });

  it('API 错误时应显示错误信息', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/years')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { years: [2026] } }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: false, error: 'Failed to load data' }),
      });
    });

    render(<Heatmap />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByText('Offline: Data sync failed')).toBeInTheDocument();
    });
  });

  it('应渲染星期标签', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] }),
    });

    render(<Heatmap />, { wrapper: TestWrapper });

    await waitFor(() => {
      // 只显示奇数行的星期标签 (Mon, Wed, Fri)
      expect(screen.getByText('Mon')).toBeInTheDocument();
      expect(screen.getByText('Wed')).toBeInTheDocument();
      expect(screen.getByText('Fri')).toBeInTheDocument();
    });
  });

  it('点击年份按钮应切换年份', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/years')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { years: [2026, 2025] } }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });
    });

    render(<Heatmap />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '2025' })).toBeInTheDocument();
    });

    // 清除之前的调用记录
    (global.fetch as jest.Mock).mockClear();

    // 点击 2025 年按钮
    fireEvent.click(screen.getByRole('button', { name: '2025' }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('year=2025'));
    });
  });
});
