import { Globe, Plus, Trash2 } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';

import { Button } from '@/components/ui/button';
import type { ServiceConfig } from '@/types';

interface HttpSettingsSectionProps {
  config: Partial<ServiceConfig>;
  setConfig: Dispatch<SetStateAction<Partial<ServiceConfig>>>;
  headersStr: string;
  headersInvalid: boolean;
  onHeadersChange: (value: string) => void;
  onAddUrl: () => void;
  onRemoveUrl: (index: number) => void;
  onUpdateUrl: (index: number, value: string) => void;
}

export function HttpSettingsSection({
  config,
  setConfig,
  headersStr,
  headersInvalid,
  onHeadersChange,
  onAddUrl,
  onRemoveUrl,
  onUpdateUrl,
}: HttpSettingsSectionProps) {
  return (
    <section className="space-y-4 border-t border-[#f0f0ed] pt-4">
      <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
        <Globe className="h-3.5 w-3.5" aria-hidden="true" /> HTTP Settings
      </h3>
      <div className="space-y-3">
        <label className="text-[11px] font-medium text-text-tertiary">Target URL(s)</label>
        {(config.config?.urls || ['']).map((url, index) => (
          <div key={index} className="flex gap-2">
            <input
              value={url}
              onChange={event => onUpdateUrl(index, event.target.value)}
              placeholder="https://api.example.com/checkin"
              aria-label={`Target URL ${index + 1}`}
              className="min-w-0 flex-1 rounded-lg border border-[#e5e5e0] bg-[#f9f9f9] px-3 py-2 text-sm focus:border-[#d97757]/50 focus:outline-none"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemoveUrl(index)}
              className="text-gray-400 hover:bg-red-50 hover:text-red-500"
              aria-label={`Remove URL ${index + 1}`}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        ))}
        <Button
          variant="link"
          size="sm"
          onClick={onAddUrl}
          className="h-auto px-0 text-accent-primary hover:text-accent-primary/80"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add another node
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label htmlFor="http-method" className="text-[11px] font-medium text-text-tertiary">
            Method
          </label>
          <select
            id="http-method"
            value={config.config?.method}
            onChange={event =>
              setConfig(current => ({
                ...current,
                config: {
                  ...current.config!,
                  method: event.target.value as 'GET' | 'POST' | 'PUT',
                },
              }))
            }
            className="w-full rounded-lg border border-[#e5e5e0] bg-[#f9f9f9] px-3 py-2 text-sm"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
          </select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor="cookie" className="text-[11px] font-medium text-text-tertiary">
            Cookie (Direct Input)
          </label>
          <input
            id="cookie"
            value={config.secret_config?.cookie || ''}
            onChange={event =>
              setConfig(current => ({
                ...current,
                secret_config: { ...current.secret_config!, cookie: event.target.value },
              }))
            }
            placeholder="paste your cookie string here"
            className="w-full rounded-lg border border-[#e5e5e0] bg-[#f9f9f9] px-3 py-2 font-mono text-sm"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="headers" className="text-[11px] font-medium text-text-tertiary">
          Headers (JSON)
        </label>
        <input
          id="headers"
          value={headersStr}
          onChange={event => onHeadersChange(event.target.value)}
          className={`w-full rounded-lg border bg-[#f9f9f9] px-3 py-2 font-mono text-sm focus:outline-none ${
            headersInvalid ? 'border-red-400 focus:border-red-500' : 'border-[#e5e5e0]'
          }`}
          aria-invalid={headersInvalid}
        />
        {headersInvalid && <p className="text-[10px] text-red-500">Invalid headers JSON.</p>}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="success-message-template"
          className="text-[11px] font-medium text-text-tertiary"
        >
          Success Message Template
        </label>
        <input
          id="success-message-template"
          value={config.config?.success_message_template || ''}
          onChange={event =>
            setConfig(current => ({
              ...current,
              config: {
                ...current.config!,
                success_message_template: event.target.value,
              },
            }))
          }
          placeholder="例如：{{service}} 签到成功，获得 {{points}} 积分 [{{time}}]"
          className="w-full rounded-lg border border-[#e5e5e0] bg-[#f9f9f9] px-3 py-2 text-sm"
        />
        <p className="text-[11px] text-text-secondary">
          可用变量：{'{{service}}'}、{'{{time}}'}、{'{{trigger}}'} 以及返回 JSON 路径，如
          {' {{points}} '}或 {'{{data.reward}}'}。
        </p>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="repeat-message-template"
          className="text-[11px] font-medium text-text-tertiary"
        >
          Repeat Check-in Template
        </label>
        <input
          id="repeat-message-template"
          value={config.config?.repeat_message_template || ''}
          onChange={event =>
            setConfig(current => ({
              ...current,
              config: {
                ...current.config!,
                repeat_message_template: event.target.value,
              },
            }))
          }
          placeholder="例如：{{service}} 今日已签到，未获得新积分"
          className="w-full rounded-lg border border-[#e5e5e0] bg-[#f9f9f9] px-3 py-2 text-sm"
        />
        <p className="text-[11px] text-text-secondary">
          当接口成功但不增加计数时使用，适合“今日已签到”这类重复签到提示。
        </p>
      </div>
    </section>
  );
}
