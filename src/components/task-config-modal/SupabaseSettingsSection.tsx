import { Eye, EyeOff, Globe } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';

import { Button } from '@/components/ui/button';
import type { ServiceConfig } from '@/types';

interface SupabaseSettingsSectionProps {
  config: Partial<ServiceConfig>;
  setConfig: Dispatch<SetStateAction<Partial<ServiceConfig>>>;
  showSupabaseKey: boolean;
  onToggleSupabaseKey: () => void;
}

export function SupabaseSettingsSection({
  config,
  setConfig,
  showSupabaseKey,
  onToggleSupabaseKey,
}: SupabaseSettingsSectionProps) {
  return (
    <section className="space-y-4 border-t border-[#f0f0ed] pt-4">
      <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
        <Globe className="h-3.5 w-3.5" aria-hidden="true" /> Remote Supabase Settings
      </h3>
      <p className="text-[11px] text-text-secondary">
        Leave blank to use the current project credentials.
      </p>

      <div className="space-y-1.5">
        <label htmlFor="supabase-url" className="text-[11px] font-medium text-text-tertiary">
          Supabase URL
        </label>
        <input
          id="supabase-url"
          value={config.config?.supabase_url || ''}
          onChange={event =>
            setConfig(current => ({
              ...current,
              config: { ...current.config!, supabase_url: event.target.value },
            }))
          }
          placeholder="https://your-project.supabase.co"
          className="w-full rounded-lg border border-[#e5e5e0] bg-[#f9f9f9] px-3 py-2 text-sm focus:border-[#d97757]/50 focus:outline-none"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="supabase-key" className="text-[11px] font-medium text-text-tertiary">
          Service Role Key (Private)
        </label>
        <div className="relative">
          <input
            id="supabase-key"
            type={showSupabaseKey ? 'text' : 'password'}
            value={config.secret_config?.supabase_key || ''}
            onChange={event =>
              setConfig(current => ({
                ...current,
                secret_config: {
                  ...current.secret_config!,
                  supabase_key: event.target.value,
                },
              }))
            }
            placeholder="your-service-role-key"
            className="w-full rounded-lg border border-[#e5e5e0] bg-[#f9f9f9] py-2 pl-3 pr-10 text-sm focus:border-[#d97757]/50 focus:outline-none"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onToggleSupabaseKey}
            className="absolute right-1 top-1/2 -translate-y-1/2 text-text-secondary hover:text-foreground"
            aria-label={showSupabaseKey ? 'Hide service key' : 'Show service key'}
          >
            {showSupabaseKey ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="table-name" className="text-[11px] font-medium text-text-tertiary">
            Target Table (for keep-alive query)
          </label>
          <input
            id="table-name"
            value={config.config?.table_name || ''}
            onChange={event =>
              setConfig(current => ({
                ...current,
                config: { ...current.config!, table_name: event.target.value },
              }))
            }
            placeholder="keep_alive (default)"
            className="w-full rounded-lg border border-[#e5e5e0] bg-[#f9f9f9] px-3 py-2 text-sm focus:border-[#d97757]/50 focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="probe-table" className="text-[11px] font-medium text-text-tertiary">
            Probe Table (optional)
          </label>
          <input
            id="probe-table"
            value={config.config?.probe_table || ''}
            onChange={event =>
              setConfig(current => ({
                ...current,
                config: { ...current.config!, probe_table: event.target.value },
              }))
            }
            placeholder="memos, users, or another business table"
            className="w-full rounded-lg border border-[#e5e5e0] bg-[#f9f9f9] px-3 py-2 text-sm focus:border-[#d97757]/50 focus:outline-none"
          />
        </div>
      </div>
    </section>
  );
}
