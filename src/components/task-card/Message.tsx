import { AlertCircle, Check, X } from 'lucide-react';
import { memo } from 'react';

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
        displayStatus === 'error' ? 'text-[#9f3e3e]' : 'text-[#3f6212]'
      }`}
    >
      <span className="mt-[2px] shrink-0">
        {(displayStatus === 'success' || (displayStatus === 'idle' && message.includes('✓'))) && (
          <Check className="w-4 h-4" />
        )}
        {displayStatus === 'error' && <AlertCircle className="w-4 h-4" />}
      </span>
      <p className="leading-relaxed">{message}</p>
      <button
        onClick={onDismiss}
        className="absolute top-0 right-0 p-0.5 hover:bg-black/5 rounded transition-colors"
        title="Dismiss message"
      >
        <X className="w-3 h-3 opacity-50 hover:opacity-100" />
      </button>
    </div>
  );
});
