import { Loader2, Play } from 'lucide-react';
import { memo } from 'react';
import { Button } from '@/components/ui/button';

interface ActionsProps {
  displayStatus: 'idle' | 'loading' | 'success' | 'error';
  onRun: () => void;
  isGuest?: boolean;
}

export const Actions = memo(function Actions({ displayStatus, onRun, isGuest }: ActionsProps) {
  return (
    <div className="mt-auto pt-6 border-t border-[#f0f0ed]">
      <div className="flex items-center gap-4">
        <Button
          variant="brand"
          onClick={onRun}
          disabled={displayStatus === 'loading' || isGuest}
          className="px-6 h-11 gap-2"
          title={isGuest ? 'Sign in to run task' : 'Run Task'}
        >
          {displayStatus === 'loading' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4 fill-current" />
          )}
          Run Task
        </Button>
      </div>
    </div>
  );
});
