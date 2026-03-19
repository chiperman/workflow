import { AlertCircle, Check, X } from 'lucide-react';
import { memo } from 'react';
import { Button } from '@/components/ui/button';

interface MessageProps {
  message: string;
  displayStatus: 'idle' | 'loading' | 'success' | 'error';
  onDismiss: () => void;
}

export const Message = memo(function Message({ message, displayStatus, onDismiss }: MessageProps) {
  if (!message) return null;

  return (
    <div
      className={`mt-4 flex items-start gap-2 text-sm font-mono relative pr-6 ${
        displayStatus === 'error' ? 'text-red-600' : 'text-emerald-700'
      }`}
    >
      <span className="mt-[2px] shrink-0">
        {(displayStatus === 'success' || (displayStatus === 'idle' && message.includes('✓'))) && (
          <Check className="w-4 h-4" />
        )}
        {displayStatus === 'error' && <AlertCircle className="w-4 h-4" />}
      </span>
      <p className="leading-relaxed">{message}</p>
      <Button
        variant="ghost"
        size="icon"
        onClick={onDismiss}
        className="absolute -top-1 -right-1 size-8 text-text-secondary hover:text-foreground"
        title="Dismiss message"
        aria-label="Dismiss message"
      >
        <X className="w-3 h-3" />
      </Button>
    </div>
  );
});
