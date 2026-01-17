import { Loader2, Play } from 'lucide-react';
import { memo } from 'react';
import { CreateGuide } from '../CreateGuide';

interface ActionsProps {
  title: string;
  displayStatus: 'idle' | 'loading' | 'success' | 'error';
  onRun: () => void;
  showCreateGuide: boolean;
  onCopyGuide: (text: string) => void;
}

export const Actions = memo(function Actions({
  title,
  displayStatus,
  onRun,
  showCreateGuide,
  onCopyGuide,
}: ActionsProps) {
  return (
    <div className="mt-auto pt-6 border-t border-[#f0f0ed]">
      <div className="flex items-center gap-4">
        <button
          onClick={onRun}
          disabled={displayStatus === 'loading'}
          className={`
            group flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-all duration-200
            ${
              displayStatus === 'loading'
                ? 'bg-[#e5e5e0] text-[#888888] cursor-not-allowed'
                : 'bg-[#191919] text-[#fdfcf8] hover:bg-[#333333] active:translate-y-0.5'
            }
          `}
        >
          {displayStatus === 'loading' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4 fill-current" />
          )}
          Run Task
        </button>
      </div>

      <CreateGuide
        service={title === 'Supabase' || title === 'GLaDOS' ? 'supabase' : 'leancloud'}
        show={showCreateGuide}
        onCopy={onCopyGuide}
      />
    </div>
  );
});
