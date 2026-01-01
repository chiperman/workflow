'use client';

import { useState } from 'react';

/**
 * 错误测试组件
 *
 * 用于测试 ErrorBoundary 是否正确捕获错误
 * 仅在开发环境使用
 */
export function ErrorTest() {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    throw new Error('Test error from ErrorTest component');
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setShouldThrow(true)}
        className="px-4 py-2 bg-red-500 text-white rounded-md text-sm font-medium hover:bg-red-600 transition-colors"
      >
        🧪 Trigger Error
      </button>
    </div>
  );
}
