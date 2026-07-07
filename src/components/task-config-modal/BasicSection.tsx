import { Eye, EyeOff, Settings } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';

import { Button } from '@/components/ui/button';
import type { ServiceConfig } from '@/types';

interface BasicSectionProps {
  serviceId?: string;
  config: Partial<ServiceConfig>;
  setConfig: Dispatch<SetStateAction<Partial<ServiceConfig>>>;
  showBarkKey: boolean;
  onToggleBarkKey: () => void;
}

export function BasicSection({
  serviceId,
  config,
  setConfig,
  showBarkKey,
  onToggleBarkKey,
}: BasicSectionProps) {
  return (
    <section className="space-y-4">
      <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
        <Settings className="h-3.5 w-3.5" aria-hidden="true" /> Basic Configuration
      </h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="service-id" className="text-[11px] font-medium text-text-tertiary">
            Service ID (unique)
          </label>
          <input
            id="service-id"
            disabled={!!serviceId}
            value={config.service || ''}
            onChange={event =>
              setConfig(current => ({ ...current, service: event.target.value.toLowerCase() }))
            }
            placeholder="e.g. glados"
            className="w-full rounded-lg border border-[#e5e5e0] bg-[#f9f9f9] px-3 py-2 text-sm focus:border-[#d97757]/50 focus:outline-none disabled:opacity-50"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="display-name" className="text-[11px] font-medium text-text-tertiary">
            Display Name
          </label>
          <input
            id="display-name"
            value={config.name || ''}
            onChange={event => setConfig(current => ({ ...current, name: event.target.value }))}
            placeholder="e.g. GLaDOS Checkin"
            className="w-full rounded-lg border border-[#e5e5e0] bg-[#f9f9f9] px-3 py-2 text-sm focus:border-[#d97757]/50 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="category" className="text-[11px] font-medium text-text-tertiary">
            Category
          </label>
          <input
            id="category"
            value={config.category || ''}
            onChange={event => setConfig(current => ({ ...current, category: event.target.value }))}
            placeholder="e.g. Access Protocol"
            className="w-full rounded-lg border border-[#e5e5e0] bg-[#f9f9f9] px-3 py-2 text-sm focus:border-[#d97757]/50 focus:outline-none"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor="notification-level"
              className="text-[11px] font-medium text-text-tertiary"
            >
              Notification Level
            </label>
            <select
              id="notification-level"
              value={config.notification_level}
              onChange={event =>
                setConfig(current => ({
                  ...current,
                  notification_level: event.target.value as 'always' | 'failure-only' | 'none',
                }))
              }
              className="w-full rounded-lg border border-[#e5e5e0] bg-[#f9f9f9] px-3 py-2 text-sm focus:border-[#d97757]/50 focus:outline-none"
            >
              <option value="always">Always Notify</option>
              <option value="failure-only">On Failure Only</option>
              <option value="none">Disabled</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="bark-key" className="text-[11px] font-medium text-text-tertiary">
              Bark Key (Optional)
            </label>
            <div className="relative">
              <input
                id="bark-key"
                type={showBarkKey ? 'text' : 'password'}
                value={config.secret_config?.notification_key || ''}
                onChange={event =>
                  setConfig(current => ({
                    ...current,
                    secret_config: {
                      ...current.secret_config!,
                      notification_key: event.target.value,
                    },
                  }))
                }
                placeholder="individual device key"
                className="w-full rounded-lg border border-[#e5e5e0] bg-[#f9f9f9] py-2 pl-3 pr-10 text-sm focus:border-[#d97757]/50 focus:outline-none"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onToggleBarkKey}
                className="absolute right-1 top-1/2 -translate-y-1/2 text-text-secondary hover:text-foreground"
                aria-label={showBarkKey ? 'Hide bark key' : 'Show bark key'}
              >
                {showBarkKey ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="description" className="text-[11px] font-medium text-text-tertiary">
          Description
        </label>
        <textarea
          id="description"
          rows={2}
          value={config.description || ''}
          onChange={event =>
            setConfig(current => ({ ...current, description: event.target.value }))
          }
          placeholder="Brief description of what this task does..."
          className="w-full rounded-lg border border-[#e5e5e0] bg-[#f9f9f9] px-3 py-2 text-sm focus:border-[#d97757]/50 focus:outline-none"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="task-type" className="text-[11px] font-medium text-text-tertiary">
          Task Type
        </label>
        <select
          id="task-type"
          value={config.type}
          onChange={event =>
            setConfig(current => ({
              ...current,
              type: event.target.value as 'http' | 'supabase_internal',
            }))
          }
          className="w-full rounded-lg border border-[#e5e5e0] bg-[#f9f9f9] px-3 py-2 text-sm focus:border-[#d97757]/50 focus:outline-none"
        >
          <option value="http">HTTP Request</option>
          <option value="supabase_internal">Supabase Internal</option>
        </select>
      </div>
    </section>
  );
}
