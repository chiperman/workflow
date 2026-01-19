import { AnimatePresence, motion } from 'framer-motion';
import { memo } from 'react';

interface HeaderProps {
  title: string;
  description: string;
  category: string;
  displayStatus: 'idle' | 'loading' | 'success' | 'error';
  localEnabled: boolean;
  isToggling: boolean;
  todayCheckedIn?: boolean;
  onToggle: () => void;
}

export const Header = memo(function Header({
  title,
  description,
  category,
  displayStatus,
  localEnabled,
  isToggling,
  todayCheckedIn,
  onToggle,
}: HeaderProps) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium tracking-wider uppercase text-[#6b6b6b] block">
            {category}
          </span>
          <AnimatePresence mode="popLayout">
            {!localEnabled && (
              <motion.span
                key="auto-off"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="text-[9px] font-bold tracking-wider uppercase text-orange-600 bg-orange-100 px-2 py-0.5 rounded border border-orange-200"
              >
                Auto: OFF
              </motion.span>
            )}
            {todayCheckedIn === false && (
              <motion.span
                key="not-checked-in"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="text-[9px] font-bold tracking-wider uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200"
              >
                今日未签到
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-2">
          <AnimatePresence mode="wait">
            {displayStatus !== 'idle' && (
              <motion.span
                key={displayStatus}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
                className={`text-[10px] uppercase font-bold tracking-wider ${
                  displayStatus === 'error'
                    ? 'text-red-500'
                    : displayStatus === 'success'
                      ? 'text-emerald-600'
                      : 'text-amber-500'
                }`}
              >
                {displayStatus === 'loading'
                  ? 'Running...'
                  : displayStatus === 'error'
                    ? 'Failed'
                    : 'Success'}
              </motion.span>
            )}
          </AnimatePresence>
          <button
            onClick={onToggle}
            disabled={isToggling}
            className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${localEnabled ? 'bg-emerald-500' : 'bg-gray-300'} ${isToggling ? 'opacity-50' : ''}`}
            title={localEnabled ? 'Disable auto cron' : 'Enable auto cron'}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${localEnabled ? 'translate-x-4' : 'translate-x-0'}`}
            />
          </button>
        </div>
      </div>
      <h2 className="text-xl font-medium text-[#191919] mb-2 font-serif">{title}</h2>
      <p className="text-[#555555] leading-relaxed text-sm">{description}</p>
    </div>
  );
});
