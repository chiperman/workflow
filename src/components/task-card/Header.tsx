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
  localEnabled: boolean;
  isToggling: boolean;
  todayCheckedIn?: boolean;
  remoteHeartbeatLagging?: boolean;
  consecutiveFailures?: number;
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
  localEnabled,
  isToggling,
  todayCheckedIn,
  remoteHeartbeatLagging,
  consecutiveFailures,
  onToggle,
  isGuest,
  onEdit,
  onDelete,
  serviceName,
}: HeaderProps) {
  const hasStatusBadges =
    !localEnabled || todayCheckedIn === false || remoteHeartbeatLagging || !!consecutiveFailures;

  return (
    <div className="mb-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 pt-1">
          <span className="block truncate text-[10px] font-semibold tracking-[0.18em] uppercase text-text-secondary">
            {category}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!isGuest && (
            <div className="flex items-center gap-0.5">
              {onDelete && (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(serviceName)}
                        className="h-8 w-8 text-text-secondary hover:text-red-500 hover:bg-red-50"
                        aria-label="Delete task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    }
                  />
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
                        className="h-8 w-8 text-text-secondary hover:text-accent-primary hover:bg-[#f9f9f9]"
                        aria-label="Edit configuration"
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </Button>
                    }
                  />
                  <TooltipContent side="top">
                    <p className="text-xs">Edit Configuration</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          )}
          <Tooltip>
            <TooltipTrigger
              render={
                <Switch
                  checked={localEnabled}
                  onCheckedChange={onToggle}
                  disabled={isToggling || isGuest}
                  aria-label={localEnabled ? 'Disable auto cron' : 'Enable auto cron'}
                />
              }
            />
            <TooltipContent side="top">
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

      {hasStatusBadges && (
        <div className="mt-3 min-h-6">
          <AnimatePresence mode="popLayout">
            {!localEnabled && (
              <motion.span
                key="auto-off"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="mr-1.5 mb-1.5 inline-flex h-6 items-center whitespace-nowrap rounded-md border border-orange-200 bg-orange-50 px-2 text-[10px] font-bold tracking-[0.08em] uppercase text-orange-700"
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
                className="mr-1.5 mb-1.5 inline-flex h-6 items-center whitespace-nowrap rounded-md border border-amber-200 bg-amber-50 px-2 text-[10px] font-bold tracking-[0.04em] text-amber-700"
              >
                今日未签到
              </motion.span>
            )}
            {remoteHeartbeatLagging && (
              <motion.span
                key="remote-heartbeat-lagging"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="mr-1.5 mb-1.5 inline-flex h-6 items-center whitespace-nowrap rounded-md border border-amber-200 bg-amber-50 px-2 text-[10px] font-bold tracking-[0.08em] uppercase text-amber-700"
              >
                Heartbeat Lag
              </motion.span>
            )}
            {!!consecutiveFailures && (
              <motion.span
                key="failure-streak"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="mr-1.5 mb-1.5 inline-flex h-6 items-center whitespace-nowrap rounded-md border border-red-200 bg-red-50 px-2 text-[10px] font-bold tracking-[0.08em] uppercase text-red-700"
              >
                Failures: {consecutiveFailures}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      )}

      <h2 className="mt-4 text-xl font-medium text-foreground font-serif leading-tight">{title}</h2>
      <p className="mt-3 line-clamp-2 min-h-11 text-text-tertiary leading-relaxed text-sm">
        {description}
      </p>
    </div>
  );
});
