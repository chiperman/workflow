import { CheckCircle, Globe, RefreshCw } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';

import { Button } from '@/components/ui/button';
import type { ServiceConfig } from '@/types';

interface RulesSectionProps {
  config: Partial<ServiceConfig>;
  setConfig: Dispatch<SetStateAction<Partial<ServiceConfig>>>;
  rulesStr: string;
  rulesInvalid: boolean;
  showAdvancedRules: boolean;
  isTesting: boolean;
  onRulesChange: (value: string) => void;
  onToggleAdvancedRules: () => void;
  onTestAndDetect: () => void;
}

export function RulesSection({
  config,
  setConfig,
  rulesStr,
  rulesInvalid,
  showAdvancedRules,
  isTesting,
  onRulesChange,
  onToggleAdvancedRules,
  onTestAndDetect,
}: RulesSectionProps) {
  return (
    <section className="space-y-4 border-t border-[#f0f0ed] pt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
          <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" /> Validation Rules
        </h3>
        <Button
          variant="outline"
          size="sm"
          disabled={isTesting}
          onClick={onTestAndDetect}
          className="h-8 self-start border-border-custom bg-background text-[10px] text-accent-primary hover:border-accent-primary/30 hover:text-accent-primary sm:self-auto"
          aria-label="Test and detect rules"
        >
          {isTesting ? (
            <RefreshCw className="h-3 w-3 animate-spin" aria-hidden="true" />
          ) : (
            <Globe className="h-3 w-3" aria-hidden="true" />
          )}
          Test & Detect Rules
        </Button>
      </div>

      <div className="space-y-4 rounded-xl border border-[#f0f0ed] bg-[#f9f9f9] p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <label htmlFor="smart-detection" className="text-sm font-medium text-foreground">
              Smart Detection
            </label>
            <p className="text-[11px] text-text-secondary">
              Automatically detect success keywords (Success, OK, 0)
            </p>
          </div>
          <input
            id="smart-detection"
            type="checkbox"
            checked={config.rules?.success?.smart_matching ?? true}
            onChange={event => {
              const updated = {
                ...config.rules?.success,
                smart_matching: event.target.checked,
              };
              setConfig(current => ({
                ...current,
                rules: { ...current.rules!, success: updated },
              }));
              onRulesChange(JSON.stringify(updated, null, 2));
            }}
            className="h-4 w-4 rounded text-accent-primary focus:ring-accent-primary"
          />
        </div>

        <div className="pt-2">
          <Button
            variant="link"
            size="sm"
            onClick={onToggleAdvancedRules}
            className="h-auto px-0 text-[10px] text-text-secondary underline underline-offset-4 hover:text-foreground"
            aria-expanded={showAdvancedRules}
          >
            {showAdvancedRules ? 'Hide Precise Rules' : 'Show Precise Rules (JSON)'}
          </Button>
        </div>

        {showAdvancedRules && (
          <div className="animate-in fade-in slide-in-from-top-1 space-y-3 pt-2 duration-200">
            <label htmlFor="json-rules" className="text-[11px] font-medium text-text-tertiary">
              JSON Rule Definition
            </label>
            <textarea
              id="json-rules"
              rows={10}
              value={rulesStr}
              onChange={event => onRulesChange(event.target.value)}
              className={`w-full rounded-lg border bg-white px-3 py-3 font-mono text-sm leading-relaxed shadow-inner focus:outline-none ${
                rulesInvalid
                  ? 'border-red-400 focus:border-red-500'
                  : 'border-[#e5e5e0] focus:border-[#d97757]/50'
              }`}
              aria-invalid={rulesInvalid}
            />
            {rulesInvalid && (
              <p className="mt-1 text-[10px] text-red-500">
                Invalid JSON. Save is blocked until this is fixed.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
