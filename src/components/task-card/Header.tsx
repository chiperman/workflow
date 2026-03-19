import { AnimatePresence, motion } from 'framer-motion';
import { memo } from 'react';
import { Switch } from '@/components/ui/switch';
import { Settings, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface HeaderProps {
  title: string;
  description: string;
  category: string;
  displayStatus: 'idle' | 'loading' | 'success' | 'error' | 'deleting';
  localEnabled: boolean;
  isToggling: boolean;
  todayCheckedIn?: boolean;
  onToggle: () => void;
  isGuest?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  serviceName: string;
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
  isGuest,
  onEdit,
  onDelete,
  serviceName,
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
        <div className="flex items-center gap-3">
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
                      : displayStatus === 'deleting'
                        ? 'text-amber-600'
                        : 'text-amber-500'
                }`}
              >
                {displayStatus === 'loading'
                  ? 'Running...'
                  : displayStatus === 'deleting'
                    ? 'Deleting...'
                    : displayStatus === 'error'
                      ? 'Failed'
                      : 'Success'}
              </motion.span>
            )}
          </AnimatePresence>
          <div className="flex items-center gap-1">
            {!isGuest && (
              <>
                {onDelete && (
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(serviceName)}
                          className="h-8 w-8 text-[#888888] hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-200"
                          aria-label="Delete task"
                        />
                      }
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="text-xs">Delete Task</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {onEdit && (
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(serviceName)}
                          className="h-8 w-8 text-[#888888] hover:text-[#d97757] hover:bg-[#f9f9f9] opacity-0 group-hover:opacity-100 transition-all duration-200"
                          aria-label="Edit configuration"
                        />
                      }
                    >
                      <Settings className="w-3.5 h-3.5" aria-hidden="true" />
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="text-xs">Edit Configuration</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </>
            )}
            <Tooltip>
              <TooltipTrigger>
                <Switch
                  checked={localEnabled}
                  onCheckedChange={onToggle}
                  disabled={isToggling || isGuest}
                  aria-label={localEnabled ? 'Disable auto cron' : 'Enable auto cron'}
                />
              </TooltipTrigger>
              <TooltipContent side="top">
                {' '}
                <p className="text-xs">
                  {isGuest
                    ? 'Sign in to configure'
                    : localEnabled
                      ? 'Disable auto cron'
                      : 'Enable auto cron'}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
      <h2 className="text-xl font-medium text-[#191919] mb-2 font-serif">{title}</h2>
      <p className="text-[#555555] leading-relaxed text-sm">{description}</p>
    </div>
  );
});
