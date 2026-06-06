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
    <div className="mt-auto pt-5">
      <div className="flex items-center justify-end">
        <Button
          variant="outline"
          onClick={onRun}
          disabled={displayStatus === 'loading' || isGuest}
          className="h-9 gap-2 border-[#d8d8d2] bg-[#191919] px-4 text-sm text-primary-foreground shadow-sm shadow-black/10 hover:bg-[#2a2a2a] hover:text-primary-foreground hover:border-[#191919]"
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
