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

    // 当 value 变化时启动动画
    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(() => {
        if (value !== displayValue && !isAnimating) {
            setIsAnimating(true);
            const timer = setTimeout(() => {
                setDisplayValue(value);
                setIsAnimating(false);
            }, 550);
            return () => clearTimeout(timer);
        }
    }, [value, displayValue, isAnimating]);
    /* eslint-enable react-hooks/exhaustive-deps */

    return (
        <span className="relative inline-flex h-[1.25em] overflow-hidden align-bottom">
            <span
                className={`flex flex-col ${isAnimating ? 'transition-transform duration-500 ease-in-out -translate-y-1/2' : ''}`}
                style={{ height: '2.5em' }}
            >
                <span className="h-[1.25em] leading-[1.25em] block text-center min-w-[1ch]">{displayValue}</span>
                <span className="h-[1.25em] leading-[1.25em] block text-center min-w-[1ch]">{value}</span>
            </span>
        </span>
    );
}
