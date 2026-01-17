import { memo } from 'react';

interface HeaderProps {
  title: string;
  description: string;
  category: string;
  displayStatus: 'idle' | 'loading' | 'success' | 'error';
  localEnabled: boolean;
  isToggling: boolean;
  onToggle: () => void;
}

export const Header = memo(function Header({
  title,
  description,
  category,
  displayStatus,
  localEnabled,
  isToggling,
  onToggle,
}: HeaderProps) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium tracking-wider uppercase text-[#6b6b6b] block">
            {category}
          </span>
          {!localEnabled && (
            <span className="text-[9px] font-bold tracking-wider uppercase text-orange-600 bg-orange-100 px-2 py-0.5 rounded border border-orange-200">
              Auto: OFF
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {displayStatus !== 'idle' && (
            <span
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
            </span>
          )}
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
