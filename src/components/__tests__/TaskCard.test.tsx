import type { ServiceHealth } from '@/types';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TaskCard } from '../task-card';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  AlertCircle: () => <span data-testid="alert-icon" />,
  Check: () => <span data-testid="check-icon" />,
  Loader2: () => <span data-testid="loader-icon" />,
  Play: () => <span data-testid="play-icon" />,
  X: () => <span data-testid="close-icon" />,
}));

// Mock child components
jest.mock('../CreateGuide', () => ({
  CreateGuide: () => null,
}));

jest.mock('../RollingNumber', () => ({
  RollingNumber: ({ value }: { value: number }) => <span>{value}</span>,
}));

describe('TaskCard', () => {
  const defaultProps = {
    title: 'Supabase',
    description: 'Database maintenance task',
    endpoint: '/api/supabase-keep-alive',
    category: 'Database Maintenance',
    method: 'POST' as const,
    serviceName: 'supabase',
    serviceHealth: {
      status: 'operational' as const,
      stats: { auto_count: 10, manual_count: 5, failure_count: 0 },
      enabled: true,
    } satisfies ServiceHealth,
    onStatsUpdate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('应正确渲染标题和描述', () => {
    render(<TaskCard {...defaultProps} />);

    expect(screen.getByText('Supabase')).toBeInTheDocument();
    expect(screen.getByText('Database maintenance task')).toBeInTheDocument();
    expect(screen.getByText('Database Maintenance')).toBeInTheDocument();
  });

  it('应显示统计数据', () => {
    render(<TaskCard {...defaultProps} />);

    expect(screen.getByText('10')).toBeInTheDocument(); // auto_count
    expect(screen.getByText('5')).toBeInTheDocument(); // manual_count
    expect(screen.getByText('0')).toBeInTheDocument(); // failure_count
  });

  it('应渲染 Run Task 按钮', () => {
    render(<TaskCard {...defaultProps} />);

    const runButton = screen.getByRole('button', { name: /run task/i });
    expect(runButton).toBeInTheDocument();
    expect(runButton).not.toBeDisabled();
  });

  it('点击 Run Task 按钮应触发 API 请求', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        success: true,
        message: 'Task completed',
        data: { auto_count: 10, manual_count: 6, failure_count: 0 },
      }),
    });

    render(<TaskCard {...defaultProps} />);

    const runButton = screen.getByRole('button', { name: /run task/i });
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/supabase-keep-alive'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  it('API 请求成功后应显示成功消息', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        success: true,
        message: 'Task completed successfully',
        data: { auto_count: 10, manual_count: 6, failure_count: 0 },
      }),
    });

    render(<TaskCard {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /run task/i }));

    await waitFor(() => {
      expect(screen.getByText('Task completed successfully')).toBeInTheDocument();
    });
  });

  it('API 请求失败应显示错误消息', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({
        success: false,
        message: 'Execution failed',
      }),
    });

    render(<TaskCard {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /run task/i }));

    await waitFor(() => {
      expect(screen.getByText('Execution failed')).toBeInTheDocument();
    });
  });

  it('禁用状态应显示 Auto: OFF 标签', () => {
    render(
      <TaskCard
        {...defaultProps}
        serviceHealth={{
          ...defaultProps.serviceHealth,
          enabled: false,
        }}
      />
    );

    expect(screen.getByText('Auto: OFF')).toBeInTheDocument();
  });

  it('开关按钮应可点击切换状态', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        success: true,
        service: 'supabase',
        enabled: false,
      }),
    });

    render(<TaskCard {...defaultProps} />);

    // 找到开关按钮（根据 title 属性定位）
    const toggleButton = screen.getByTitle(/disable auto cron/i);
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/service-config',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ service: 'supabase', enabled: false }),
        })
      );
    });
  });
});
