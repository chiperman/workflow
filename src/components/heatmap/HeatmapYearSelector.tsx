import { HEATMAP_COLORS, MOTION_CONFIG } from '@/config/constants';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

interface HeatmapYearSelectorProps {
  years: number[];
  selectedYear: number;
  loading: boolean;
  onSelectYear: (year: number) => void;
  yearsLoaded?: boolean;
}

export function HeatmapYearSelector({
  years,
  selectedYear,
  loading,
  onSelectYear,
  yearsLoaded = true,
}: HeatmapYearSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedButtonRef = useRef<HTMLButtonElement>(null);
  const [animationComplete, setAnimationComplete] = useState(false);

  // Scroll indicator states
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  // Animation timing
  const baseDelayMs = MOTION_CONFIG.delay.heatmapYears * 1000; // 2000ms
  const staggerMs = 60; // 60ms between each year
  const animationDurationMs = 200;
  const totalAnimationTime = baseDelayMs + years.length * staggerMs + animationDurationMs;

  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  useEffect(() => {
    if (yearsLoaded && !hasLoadedOnce) {
      // Use setTimeout to avoid synchronous setState warning
      const timer = setTimeout(() => {
        setHasLoadedOnce(true);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [yearsLoaded, hasLoadedOnce]);

  // Update scroll indicators
  const updateScrollIndicators = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setCanScrollUp(el.scrollTop > 0);
    setCanScrollDown(Math.abs(el.scrollHeight - el.clientHeight - el.scrollTop) > 1);
  }, []);

  // Auto-scroll to selected year after animation completes
  useEffect(() => {
    // Only auto-scroll on initial load or selection change, not every refresher
    if (!animationComplete) {
      const timer = setTimeout(() => {
        setAnimationComplete(true);
        if (selectedButtonRef.current) {
          selectedButtonRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center',
          });
        }
        // Force update indicators after scroll
        setTimeout(updateScrollIndicators, 300);
        setTimeout(updateScrollIndicators, 600);
      }, totalAnimationTime);
      return () => clearTimeout(timer);
    }
  }, [totalAnimationTime, updateScrollIndicators, animationComplete]); // Added animationComplete dependency to prevent re-running if already done

  // Monitor scroll position
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener('scroll', updateScrollIndicators, { passive: true });
    window.addEventListener('resize', updateScrollIndicators);
    // Initial check
    updateScrollIndicators();

    return () => {
      el.removeEventListener('scroll', updateScrollIndicators);
      window.removeEventListener('resize', updateScrollIndicators);
    };
  }, [updateScrollIndicators, years]); // Re-attach if years change (though ref content is stable mostly, good practice)

  // Helper: scroll multiple years (e.g., 3)
  const scrollOneYear = (direction: 'up' | 'down') => {
    const el = containerRef.current;
    if (!el) return;
    // Approximate item height; fallback to 40px
    const itemHeight = el.firstElementChild?.clientHeight || 40;
    const count = 3; // Scroll 3 years at a time
    const delta = direction === 'up' ? -itemHeight * count : itemHeight * count;
    el.scrollBy({ top: delta, behavior: 'smooth' });
  };

  // Only hide on initial load; keep showing stale data during revalidation/refresh
  if (!yearsLoaded && !hasLoadedOnce) return null;

  return (
    <div className="heatmap-years-sidebar flex flex-col items-end mt-4 md:mt-0 md:absolute md:top-[-24px] md:-right-20 md:bottom-[-24px]">
      {/* Scroll Up Arrow */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: canScrollUp && animationComplete ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="hidden md:flex justify-center items-center w-full h-6 cursor-pointer my-1 text-[#9ca3af] hover:text-[#191919] transition-colors"
        onClick={() => scrollOneYear('up')}
      >
        <ChevronUp className="w-4 h-4" />
      </motion.div>

      {/* Year List - using CSS animation to avoid JS overhead */}
      <div
        ref={containerRef}
        // Removed key to prevent recreating DOM node and losing event listeners
        className="flex flex-nowrap md:flex-col overflow-x-auto md:overflow-y-auto justify-start px-6 md:px-0 gap-4 md:gap-2 pb-2 md:pb-0 flex-1 scrollbar-hide"
      >
        {years.map((year, index) => (
          <Button
            key={year}
            ref={year === selectedYear ? selectedButtonRef : null}
            variant="ghost"
            size="sm"
            onClick={() => onSelectYear(year)}
            className={`year-fade-in heatmap-year-btn px-1 py-1 md:px-3 md:py-1 text-sm md:text-right transition-colors font-serif border-none rounded-none whitespace-nowrap shrink-0 h-auto ${
              year === selectedYear ? 'font-medium' : 'text-[#9ca3af] hover:text-[#191919]'
            }`}
            disabled={loading}
            style={{
              fontFamily: 'var(--font-serif)',
              color: year === selectedYear ? HEATMAP_COLORS.ACTIVE_YEAR : undefined,
              animationDelay: `${baseDelayMs + index * staggerMs}ms`,
            }}
          >
            {year}
          </Button>
        ))}
      </div>

      {/* Scroll Down Arrow */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: canScrollDown && animationComplete ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="hidden md:flex justify-center items-center w-full h-6 cursor-pointer my-1 text-[#9ca3af] hover:text-[#191919] transition-colors"
        onClick={() => scrollOneYear('down')}
      >
        <ChevronDown className="w-4 h-4" />
      </motion.div>
    </div>
  );
}
