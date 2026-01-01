'use client';

import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * 错误边界组件
 *
 * 捕获子组件树中的 JavaScript 错误，防止整个应用崩溃
 * 提供优雅的错误 UI 和恢复选项
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * 当子组件抛出错误时更新状态
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * 捕获错误详情并记录
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // 记录错误到控制台
    console.error('Error caught by ErrorBoundary:', error);
    console.error('Component stack:', errorInfo.componentStack);

    // 更新状态以包含错误信息
    this.setState({
      errorInfo,
    });

    // 可选：发送错误报告到 Bark
    if (process.env.NEXT_PUBLIC_ENABLE_ERROR_REPORTING === 'true') {
      this.sendErrorReport(error, errorInfo);
    }
  }

  /**
   * 发送错误报告到 Bark（可选功能）
   */
  private async sendErrorReport(error: Error, errorInfo: ErrorInfo): Promise<void> {
    try {
      const barkUrl = process.env.NEXT_PUBLIC_BARK_URL;
      if (!barkUrl) {
        console.warn('Bark URL not configured, skipping error report');
        return;
      }

      // 只在生产环境发送报告
      if (process.env.NODE_ENV !== 'production') {
        console.log('Development mode: Error report not sent');
        return;
      }

      const message = `
🚨 应用错误

错误: ${error.message}
堆栈: ${error.stack?.slice(0, 200)}
组件: ${errorInfo.componentStack?.slice(0, 200)}
时间: ${new Date().toISOString()}
      `.trim();

      await fetch(barkUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Workflow Error',
          body: message,
        }),
      });
    } catch (reportError) {
      console.error('Failed to send error report:', reportError);
    }
  }

  /**
   * 重试：重新加载页面
   */
  private handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.reload();
  };

  /**
   * 返回首页
   */
  private handleGoHome = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // 如果提供了自定义 fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认错误 UI
      return (
        <div className="min-h-screen bg-[#fdfcf8] flex items-center justify-center px-6">
          <div className="max-w-2xl w-full">
            {/* 错误图标 */}
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-[#9f3e3e]" />
              </div>
            </div>

            {/* 错误标题 */}
            <h1 className="text-3xl sm:text-4xl font-medium text-[#191919] mb-4 font-serif text-center">
              Something Went Wrong
            </h1>

            {/* 错误描述 */}
            <p className="text-base text-[#555555] mb-8 text-center leading-relaxed">
              We encountered an unexpected error. Don&apos;t worry, your data is safe.
              <br />
              Please try refreshing the page or return to the home page.
            </p>

            {/* 错误详情（仅开发环境） */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-lg">
                <h2 className="text-sm font-medium text-[#9f3e3e] mb-2 uppercase tracking-wider">
                  Error Details (Development Only)
                </h2>
                <p className="text-sm font-mono text-[#9f3e3e] mb-2 break-all">
                  {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <pre className="text-xs font-mono text-[#9f3e3e] overflow-x-auto whitespace-pre-wrap">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={this.handleRetry}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-[#191919] text-[#fdfcf8] rounded-md font-medium hover:bg-[#333333] transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-[#191919] border border-[#e5e5e0] rounded-md font-medium hover:bg-[#f5f5f0] transition-colors"
              >
                <Home className="w-4 h-4" />
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
