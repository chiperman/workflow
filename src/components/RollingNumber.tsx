'use client';

import { useEffect, useState } from 'react';

/**
 * 滚动数字动画组件
 *
 * 当数字变化时显示平滑的滚动动画
 */
export function RollingNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  // 当 value 变化时，如果在 render 期间检测到，直接更新状态以启动动画
  // 这种"在渲染期间更新状态"的模式是 React 官方推荐的替代 useEffect 同步 set state 的方案
  if (value !== displayValue && !isAnimating) {
    setIsAnimating(true);
  }

  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => {
        setDisplayValue(value);
        setIsAnimating(false);
      }, 550);
      return () => clearTimeout(timer);
    }
  }, [isAnimating, value]);

  return (
    <span className="relative inline-flex h-[1.25em] overflow-hidden align-bottom">
      <span
        className={`flex flex-col ${isAnimating ? 'transition-transform duration-500 ease-in-out -translate-y-1/2' : ''}`}
        style={{ height: '2.5em' }}
      >
        <span className="h-[1.25em] leading-[1.25em] block text-center min-w-[1ch]">
          {displayValue}
        </span>
        <span className="h-[1.25em] leading-[1.25em] block text-center min-w-[1ch]">{value}</span>
      </span>
    </span>
  );
}
