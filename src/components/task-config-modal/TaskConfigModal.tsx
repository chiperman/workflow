'use client';

import { RefreshCw, Save } from 'lucide-react';

import { DialogShell } from '@/components/DialogShell';
import { Button } from '@/components/ui/button';
import type { ServiceConfig } from '@/types';

import { BasicSection } from './BasicSection';
import { HttpSettingsSection } from './HttpSettingsSection';
import { RulesSection } from './RulesSection';
import { SupabaseSettingsSection } from './SupabaseSettingsSection';
import { useTaskConfigForm } from './useTaskConfigForm';

interface TaskConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceId?: string;
  initialConfig?: Partial<ServiceConfig>;
  onSuccess?: () => void;
}

export function TaskConfigModal({
  isOpen,
  onClose,
  serviceId,
  initialConfig,
  onSuccess,
}: TaskConfigModalProps) {
  const form = useTaskConfigForm({ isOpen, serviceId, initialConfig, onClose, onSuccess });

  return (
    <DialogShell
      isOpen={isOpen}
      onClose={onClose}
      title={serviceId ? 'Edit Protocol Task' : 'New Maintenance Protocol'}
      description="Configure execution and validation rules"
      closeLabel="Close modal"
      footer={
        <div className="border-t border-[#f0f0ed] bg-[#fdfcf8]/50 p-6">
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              variant="brand"
              disabled={form.isSaving}
              onClick={form.handleSave}
              className="h-11 px-6"
              aria-label={form.isSaving ? 'Saving configuration' : 'Save configuration'}
            >
              {form.isSaving ? (
                <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <>
                  <Save className="h-4 w-4" aria-hidden="true" /> Save Configuration
                </>
              )}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <BasicSection
          serviceId={serviceId}
          config={form.config}
          setConfig={form.setConfig}
          showBarkKey={form.showBarkKey}
          onToggleBarkKey={() => form.setShowBarkKey(value => !value)}
        />

        {form.config.type === 'http' && (
          <HttpSettingsSection
            config={form.config}
            setConfig={form.setConfig}
            headersStr={form.headersStr}
            headersInvalid={form.headersInvalid}
            onHeadersChange={form.updateHeaders}
            onAddUrl={form.addUrl}
            onRemoveUrl={form.removeUrl}
            onUpdateUrl={form.updateUrl}
          />
        )}

        {form.config.type === 'supabase_internal' && (
          <SupabaseSettingsSection
            config={form.config}
            setConfig={form.setConfig}
            showSupabaseKey={form.showSupabaseKey}
            onToggleSupabaseKey={() => form.setShowSupabaseKey(value => !value)}
          />
        )}

        <RulesSection
          config={form.config}
          setConfig={form.setConfig}
          rulesStr={form.rulesStr}
          rulesInvalid={form.rulesInvalid}
          showAdvancedRules={form.showAdvancedRules}
          isTesting={form.isTesting}
          onRulesChange={form.updateRules}
          onToggleAdvancedRules={() => {
            if (form.showAdvancedRules && form.rulesInvalid) return;
            form.setShowAdvancedRules(value => !value);
          }}
          onTestAndDetect={form.handleTestAndDetect}
        />
      </div>
    </DialogShell>
  );
}
